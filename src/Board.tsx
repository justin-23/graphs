import React, { ReactElement } from 'react';
import { Edge, BackgroundMode } from './Edge';
import { Vertex } from './Vertex';
import GUI from './GUI';
import Graph from './Graph';
import { AnimationType, StepEntry, Step} from './Step';
import Color from './Color';
import VertexColor from './VertexColor';
import { stringify } from 'querystring';
import { getJSDocReadonlyTag, readBuilderProgram } from 'typescript';
import { NONAME } from 'dns';


// Constants (not board size i guess)

let BOARD_SIZE = 1000;
const VERTEX_RADIUS = 50;
const PADDING_SIZE = 5;

function copy<T>(obj: T) : T {
  return JSON.parse(JSON.stringify(obj));
}

declare global {
  interface Promise<T> {
    delay(t: number): any;
  }
}
// https://stackoverflow.com/questions/39538473/using-settimeout-on-promise-chain
// from stack overflow - a promise based method to delay animations
function delay(t, v) {
  return new Promise(function(resolve) { 
      setTimeout(resolve.bind(null, v), t)
  });
}

Promise.prototype.delay = function(t) {
  return this.then(function(v) {
      return delay(t, v);
  });
}

// get coords relative to my Board div. used for placing vertices.
const getRelativeCoords = function(e: React.MouseEvent){
    // source: https://stackoverflow.com/questions/3234256/find-mouse-position-relative-to-element
    const el = document.querySelector('.board') as Element;
    
    
    const event = e.nativeEvent;
    const target = event.target as HTMLElement;


    const rect = target.getBoundingClientRect();

    const position = {
      x: event.pageX,
      y: event.pageY,
    };
  
    const offset = {
      left: rect.x,
      top: rect.y
    };
  
    return { 
      x: event.clientX- rect.x,
      y: event.clientY - rect.y,
    }; 
  
}

// Board settings - are we testing or editing? sub modes (add, connect, delete, etc)
interface BoardSettings {
  mode: string,
  editmode: string,
  testmode: string,
  speed: number,
}

// Each board has vertices, edges, and start and settings.
interface BoardState {
  vertices: Vertex[];
  edges: Edge[][];
  start: number;
  goal: number;
  settings: BoardSettings;
}

// Nothing is passed into board so props are empty!!!
interface BoardProps { };

class Board extends React.Component<BoardProps, BoardState> {

  static interpretMouseEvent = function(e: React.MouseEvent) {
    const {x, y} = getRelativeCoords(e);
    // Get coordinates reative to the board
    const index = e.target;
    // maybe delete i think
    const id = e["vertexId"];
    // get the ID of the clicked vertex.
    let validLocation = Board.isValidLocation(x, y);
    // Is within bounds?
    let hitSpacer = Boolean(e["hitSpacer"]);
    // did we hit a "spacer" (to provide room. no overlap)
    let hitVertex = id !== undefined;
    // duh
    return {
      x, y, hitSpacer, hitVertex, id, validLocation,
    }
  }
  constructor(props: any) {
    super(props);
    // Make sure all update seting and helper functions are bound to current context so they can be passed to GUI.
    ["addVertex", "deleteVertex", "updateSetting", "addEdge", "deleteEdge", "run"].forEach((fnName: string) => {
      this[fnName] = this[fnName].bind(this);
    }); // Bind all functions that are passed to child components to 'Board' this

    this.state = {
      vertices: [],
      edges: [],
      settings: {
        mode: "EDIT",
        editmode: "NEW",
        testmode: "DFS",
        speed: 1,
      },
      start: 0,
      goal: -1,
    };

    this.mouseDownVertexId = -1;
    
  }
  settings; mouseDownVertexId = -1;

  /// Retreives and passes settings up to be set on the board state.
  updateSetting (key: string, value: string) {
    const newSettings = copy<BoardSettings>(this.state.settings);
    // newSettings is now origional state plus edit
    Object.assign(newSettings, {[key]: value});

    this.setState({settings: newSettings}, () => {
      console.log(`Update set on prop ${key}: ${this.state.settings[key]}`)
    });
    
  }

  componentDidMount() {
    BOARD_SIZE = window.innerWidth;
  }

  static isValidLocation(x: number, y: number) {
    let outBox = [x, y].some(dim => dim < (PADDING_SIZE + VERTEX_RADIUS) || dim > (BOARD_SIZE - PADDING_SIZE - VERTEX_RADIUS));
    return !(outBox);
  }

  setStart(v: number) : void {
    const prevStart = this.state.start;
    const prevStartVertex = this.getVertex(prevStart);
    if (prevStartVertex) prevStartVertex.setState({isStart: false});
    this.setState({start: v});
    this.getVertex(v).setStart();/*setState({isStart: true}, function() {
      console.log("Set state");
    });*/
  }

  setGoal(v: number) : void {
    const prevGoal = this.state.goal;
    const prevgoalVertex = this.getVertex(prevGoal);
    if (prevgoalVertex) prevgoalVertex.setState({isGoal: false});
    this.setState({goal: v});
    this.getVertex(v).setGoal();/*setState({isgoal: true}, function() {
      console.log("Set state");
    });*/
  }

  onmousedown(event: React.MouseEvent) : void {

    const {x, y, hitSpacer, hitVertex, id, validLocation} = Board.interpretMouseEvent(event);

    // When we receive a mouse down event, we decide what to do based on the current bord state.
    const mode: string = this.state.settings["mode"];
    if (mode == 'EDIT') {
        switch (this.state.settings["editmode"]) {
            case 'NEW':
              if (validLocation && !hitSpacer) this.addVertex(x, y); 
              break;
            case 'DELETE':
              if (hitVertex) this.deleteVertex(id); 
              break;
            case 'CONNECT':
              if (hitVertex) this.mouseDownVertexId = id;
              break;
            case 'SET START':
              if (hitVertex) this.setStart(id);
              break;
            case 'SET GOAL':
              if (hitVertex) this.setGoal(id);
              break;  
            default: break;
          }
    } else if (mode == 'TEST') {
        //console.log("Edges", this.state.edges);
        //const colors = ["red", "yellow", "blue", "grey", "green", "black"];
    } else {
        console.log("unknown board mode");
    }
    
  }
  // Helper functions
  getAllVertices() : Vertex[] {
    return [...this.state.vertices];
  }
  getAllEdges() : Edge[] {
    return [...this.state.edges.flat().filter(Boolean)];
  }
  private getVertex(index1: number) : Vertex {
    return this.state.vertices[index1];
  }

  private getEdge(index1: number, index2: number) : Edge {
    return this.state.edges[index1][index2];
  }

  private getStart() : Vertex {
    return this.getVertex(this.state.start);
  }

  private getGoal() : Vertex {
    return this.getVertex(this.state.goal);
  }


  onmouseup(event: React.MouseEvent) : void {

    const {x, y, hitSpacer, hitVertex, id, validLocation} = Board.interpretMouseEvent(event);
    const mode: string = this.state.settings["mode"];
    // Once again, we decide what to do with a mouse up event based on the current Board state.
    if (mode == 'EDIT') {
        switch (this.state.settings["editmode"]) {
        case 'CONNECT':
            if (hitVertex) {
            const from = this.mouseDownVertexId;
            const to = id;

            this.addEdge(from, to);
            break;
            }
        }
    } else if (mode == 'TEST') {
      return; // not needed
    }
  } 

  // Add a vertex to the board
  addVertex(x: number, y: number) : Vertex {
   
    const position = this.state.vertices.length;
    // get new vertex idex.
    let vertices = this.state.vertices;
    let edges = this.state.edges;//copy<Edge[][]>(this.state.edges);

    const v = Vertex.default(position, x, y);
    // Create new. add it to the vertex list.
    vertices.push(v);
    // give it an edge list.
    edges.push([]);
    
    this.setState({vertices, edges})

    return v;
  }
  // This function barely works. Try not to delete vertices if not needed.
  deleteVertex(index: number) : void {
    const vertices = this.state.vertices; // get the current vertexs
    const edges = this.state.edges; 
    vertices.splice(index, 1); // Remove the proper index
    edges.splice(index, 1); // remove proper index
    const length = vertices.length;
    for (let i = index; i <  length; i++) {
      // Reindex all the values on other vertices so that everything is still right
      vertices[i].decrementIndex() 
      edges[i] = edges[i].map((edge: Edge, j) => (edge.getIndex1() >= index) ? edges[i][j+1] : edge);
      
    }
    this.setState({vertices, edges}); // set the new ones 
  }
  
  addEdge(index1: number, index2: number) : void{
    const edges = this.state.edges;
    const row = edges[index1];
    const el = row[index2];
    if (el !== undefined) return; // make sure there's not an edge already there
    row[index2] = Edge.default(this.getVertex(index1), this.getVertex(index2));
    this.setState({edges}, () => {
      console.log("new edges area: ", this.state.edges)
    });
  }

  deleteEdge(index1: number, index2: number) : void  {

  }
  renderVertices() {
    return this.state.vertices.map
    (
      (vertex: Vertex) => vertex.render()
    );
  }
  
  // Render the edges
  renderEdges() {
    return this.state.edges.map
    (
      (tos: Edge[]) => tos.map((edge: Edge) => edge.render())
    ).flat()
  }
// Creates an "all" wrapper promise which resolves when all substeps are done.
  animateStep(step: Step, speed: number) {
    return Promise.all<void>(step.frames.map((entry: StepEntry) => {
      return this.animateStepEntry(entry, speed);
    }));
  }

  // We use promises to manage the asynchronous activity nessecary for animations.
  animateStepEntry(entry: StepEntry, speed: number) {
    switch (entry.animationType) {
      case AnimationType.SweepForward:
        return new Promise<void>((resolve, reject) => {
          this.doSweep(speed, entry.index1, entry.index2 || 0, entry.color1, entry.color2 || "something has gone wrong");
          resolve();//setTimeout(() => resolve(), 400);
        });
      case AnimationType.FadeVertex: 
        return new Promise<void>((resolve, reject) => {
          this.fadeVertex(entry.index1, entry.color1);
          resolve();
        });
      default:
        return Promise.resolve();
    }
  }

  animateSteps(steps: Step[]) {
    //steps.reduceRight((current, step) => current.then(this.animateStep(step)), Promise.resolve())
    
    steps.reduce((curr, step) => {
      const time = Math.max.apply(null, step.frames.map((frame: StepEntry) => frame.time));
      return curr.then(() => this.animateStep(step, this.state.settings.speed).delay(time *  5 / 3))
    }, Promise.resolve())
  }
 
  // REset everything when we run a new animation
  reset() {
    this.getAllEdges().forEach(edge => edge.reset());
    this.getAllVertices().forEach(vertex => vertex.reset());
  }
  run() {

    console.log("VERTICES", this.state.vertices);
    console.log(this.state);
    this.reset();
    const graph = new Graph(this.state.edges);
    console.log(graph);
    let steps: Step[];
    const time = 500 - this.state.settings.speed * 200;
    if (this.state.goal  < 0) return;
    switch (this.state.settings["testmode"]) {
      case 'DFS':
        steps = graph.runDepthFirstSearch(time, this.state.start, this.state.goal, Color.Black); break;
      case 'BFS':
        steps = graph.runBreadthFirstSearch(time, this.state.start, this.state.goal, Color.Black); break;
      default:
      break;
    }
    //this.getVertex(this.state.start).fadeTo(Color.Black);
    Promise.resolve().then(resolve => this.animateSteps(steps));
  
  }
  
  fadeVertex(index1: number, color: string) : void {
    let v: Vertex = this.getVertex(index1);
    v.fadeTo(color);
  }

  // To create a "sweep" effect, we not only have to call methods on Edge and Vertex to animate it,
  // we must also change the state of Board, Edge, and Vertex to reflect hte change.
  doSweep(speed: number, index1: number, index2: number, color1: string, color2: string) {
    const v1 = this.getVertex(index1);
    const v2 = this.getVertex(index2);
    console.log("sweep vertices", {v1, v2})
    const edge = this.getEdge(index1, index2);

    this.animateSweep(speed, edge, v1.state.color, color1);
    Promise.resolve().delay(speed * 0.7).then(resolve => v2.fadeTo(color1));
  }

  animateSweep(speed: number, edge: Edge, color1: string, color2: string) {
    edge.sweepForward(speed, color1, color2);
  }

  render() {

    let start = this.getStart()?.props?.p;
    let goal = this.getGoal()?.props?.p;
    return (
    <div className="board">
      <GUI up={{set: this.updateSetting, run: this.run}} />
      <div className = "boardDisplay"  
        onMouseDown={(e: React.MouseEvent) => this.onmousedown(e)}
        onMouseUp={(e: React.MouseEvent) => this.onmouseup(e)}
      >
        { [...this.renderVertices(), ...this.renderEdges()] }
        <div className="start_box box" style={{
          display: start ? "inherit" : "none",
          left: start?.x - 37 || 0,
          top: start?.y - 37 || 0,
        }}></div>
        <div className="goal_box box" style={{
          display: goal ? "inherit" : "none",
          left: goal?.x - 37|| 0,
          top: goal?.y - 37 || 0,
        }}></div>
      </div>
    </div>
      )
  }
}

export default Board;