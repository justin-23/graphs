import { NONAME } from 'dns';
import React from 'react';
import { NumberLiteralType } from 'typescript';
import { Vertex, Color } from './Vertex';


// Default speed
const SPEED = 300;

// bad version of deep copy. but works for most stuff.
function copy<T>(obj: T) : T {
    return JSON.parse(JSON.stringify(obj));
  }

  //I create the clip path data dynamically, based on the radius of a circle and the arc that the clip-path should cover
  const getPts = (theta, r, width) => {
    //let a = (r - width) / r;
    return {
        x1: r * Math.cos(theta),
          y1: r * Math.sin(theta),
          x2: r / Math.cos(theta) - Math.tan(theta) * width,
          y2: width,
      }
  }
  
  //I create this svg class to more easily make my path strings.
  class SvgPath {
    
    paths: string[] = [];
    offX: number = 0;
    offY: number = 0;

      moveTo(x, y) : void {
        this.paths.push(`M ${x + this.offX} ${y + this.offY}`);
      };
      
      lineTo (x, y) : void {
        this.paths.push(`L ${x + this.offX} ${y + this.offY}`);
      }
      
      curveTo (h1_x, h1_y, h2_x, h2_y, px, py) : void {
        this.paths.push("C " + [h1_x + this.offX, h1_y + this.offY, h2_x + this.offX, h2_y + this.offY, px + this.offX, py + this.offY].join(' '));
      }
      unroll () : string {
        return this.paths.join(' ').replaceAll(/\.\d+ /g, " ");
      }
  }
  
  const makePath = function(theta1, theta2, middle, l, r, width) {
     const p = new SvgPath();
       p.offY = r;
       (() => {
       let { x1, y1, x2, y2} = getPts(theta1, r, width);
       p.moveTo(0, 0);
       p.lineTo(x1, y1);
       p.curveTo(x2, y2, x2, y2, middle, width);
       p.lineTo(middle, 0)
       p.lineTo(0, 0);
       p.lineTo(x1, -y1);
       p.curveTo(x2, -y2, x2, -y2, middle, -width);
       p.lineTo(middle, 0);
       p.lineTo(0, 0);
       })();
       (() => {
      const { x1, y1, x2, y2} = getPts(theta2, r, width);
       p.moveTo(l, 0);
       p.lineTo(l - x1, y1);
       p.curveTo(l - x2, y2, l - x2, y2, middle, width);
       p.lineTo(middle, 0);
       p.lineTo(l, 0);
       p.lineTo(l - x1, -y1);
       p.curveTo(l - x2, -y2, l - x2, -y2, middle, -width);
       p.lineTo(middle, 0);
       p.lineTo(l, 0);
       })();
      
       
       return `path(nonzero, "${p.unroll()}")`;
  }

type BackgroundEvent = Record<string, (color1: string, color2?: string) => void>;

// Shouldn't ever get thrown, made for debugging, but will be thrown when color strings are improperly passed.
class ColorError extends Error {
  constructor(name, mode) {
    super(`Attempted to call ${name} while edge was in stage ${mode}`);
    this.name = "ColorError";
  }
}
// Is the background of an edge a solid color or gradient right now?
enum BackgroundMode {
  Solid,
  Gradient
}
interface EdgeProps {
    p1: Vertex,
    p2: Vertex,
    color1: string,
    color2: string,
    // props: vertices it belongs to, and colors it should start with.
  }

  interface EdgeState {
    clipState: number;
    color1: string,
    color2: string,
    backgroundMode: BackgroundMode,
  }
  
  class Edge extends React.Component<EdgeProps, EdgeState> {

    private clipStates: string[] = [];
    private w: number;
    private h: number;
    private length: number;
    private left: number;
    private top: number;
    private angle: number;
    // These are properties of the Edge class itself, not the state. This distinction is made because these
    // variables are only generated once, internally, and the component does not need to react to their modification

    static default(p1: Vertex, p2: Vertex) {
      return new Edge({
        p1, p2,
        backgroundMode: BackgroundMode.Solid,
        color1: Color.Default,
        color2: Color.Default,
      });

      // Default edges should be Default color.
    }


    constructor (props) {
      super(props);
      // Should start as a "defualt" edge - grey and inactive.
      this.state = {
        clipState: 0,
        color1: props.color1,
        color2: props.color2,
        backgroundMode: BackgroundMode.Solid,
      }
      // We use createRef to get access to particular HTML elements for our render function
      // apparently bad practice but whatever 

      this.colorRef = React.createRef();
      const {p1, p2} = props;
      // Calculating transform properties of the Edge position on screen.
      this.w = p2.props.p.x - p1.props.p.x;
      this.h = p2.props.p.y - p1.props.p.y;
      this.length = Math.hypot(this.w, this.h);
      this.left = p1.props.p.x;//Math.min(x1, x2);
      this.top = p1.props.p.y;//Math.min(y1, y2);
      this.angle = Math.atan2(this.h, this.w) * 180 / Math.PI;// * Math.sign(h);

      const l  = this.length;
      this.clipStates = [
        // These represent the keyframes between which the CSS engine should animate
        // a large (> Math.PI / 3) value for an angle means that side will be "fatter".

        makePath(Math.PI / 6, Math.PI / 6, l * 0.5, l, 30, 3),
        makePath(Math.PI * 2 / 5, Math.PI / 6, l * 0.8, l, 30, 5),
        makePath(Math.PI / 6, Math.PI * 2 / 5, l * 0.3, l, 30, 5),
        makePath(Math.PI * 2 / 5, Math.PI * 2 / 5, l * 0.5, l, 30, 10),
      ]
    }
    // When the component is created. make sure it's in the default clip state (dormant and thin)
    componentDidMount() {
      console.log("mounted");
      this.setClipState(0);
    }

    colorRef;
    //Helper functions
    getIndex1() : number {
      return this.props.p1.state.index1;
    }

    getIndex2(): number {
      return this.props.p2.state.index1;
    }

    // The css gives particular CSS properties transition times. However, sometimes they need
    // to be done instantly. styleInstantly takes a function with style changes to be run, adds a "notransition" class
    // which removes all transitions and timing, runs the function, and removes the notransition class.
    
    styleInstantly(el: HTMLElement, f: Function) {
      // https://stackoverflow.com/questions/11131875/what-is-the-cleanest-way-to-disable-css-transition-effects-temporarily
      el.classList.add('notransition');
      f();
      let x = el.offsetHeight;
      el.classList.remove('notransition');
    }
      /*Solid(1) fades to Solid(2);
      Solid(1) swipes to Solid(2)
      Solid(1) reverse swipes to Solid(2);
      Solid(x) fades to Gradient(x, y)
      Solid(y) fades to Gradient(x, y)
      Solid(x) swipes to Gradient(x y)
      Solid(y) swipes to Gradient(x, y)
      Gradient(x, y) fades to Solid(x)
      Gradient(x, y) fades to Solid(y)
      Gradient(x, y) swipes to Solid(x)
      Gradient(x, y) swipes to Gradient(x) 
      Gradient(x, y) fades to Gradient(z, y)
      Gradient(x, y) fades to Gradient(x, z);*/

    // Removes the background  image. updates the state.
    fadeToSolid(color1: string) {
      const lineDiv = this.colorRef.current.querySelector('.edge_inner');
      
      this.styleInstantly(lineDiv, () => {
        lineDiv.style.backgroundImage = "none";
      })
      //this.setState({clipState})
    }
    
    //  Modifies the way the edge_inner looks, and updates the Edge state.
    setClipState(clipState: number) {
      const lineDiv = this.colorRef.current.querySelector('.edge_inner');
      lineDiv.style.clipPath = this.clipStates[clipState];
      this.setState({clipState})
    }
    // Creates our "sweep" gradient who's x position we animate 
    makeGradientString(color1: string, color2: string) : string {
      return `linear-gradient(90deg, ${color2} 0%, ${color2} 33%, ${color1} 67%, ${color1} 100%)`;
    }

    // Reset every property when we begin an animation.
    reset() {
      this.fadeToSolid(Color.Default);
      this.setState({backgroundMode: BackgroundMode.Solid, color1: Color.Default});
      //this.sweepForward(Color.Default, Color.Default);
      this.setState({
        color1: Color.Default,
        color2: Color.Default,
        backgroundMode: BackgroundMode.Solid,
      })
    }
    // Execute a "sweep" animation
    sweepForward(speed: number, color1: string, color2: string) : void {
      // Error handling
      if (this.state.backgroundMode == BackgroundMode.Gradient) {
        throw new ColorError("moveForward", this.state.backgroundMode);
      }

    
      const gradient = this.makeGradientString(color1, color2);
      const newBG = {
        backgroundImage: gradient,
      }
      const lineDiv = this.colorRef.current.querySelector('.edge_inner');
      if ( !lineDiv ) return;

      // Set the position to the "beginning" of the gradient. This should be a seamless transition
      // from the edge just being that solid color.
      this.styleInstantly(lineDiv, () => {
        lineDiv.style.backgroundImage = gradient;
        lineDiv.style.backgroundPositionX = "100%";
      });
      // large left side
      this.setClipState(1);
      lineDiv.style.backgroundPositionX = "66%";
      // some new color peeks in

      const onComplete = () => {
        this.styleInstantly(lineDiv, () => {
          // when we end up fully in color2 of the gradient, set
          // this edge to just be solid, and only "that color".
          lineDiv.style.backgroundImage = color2;
          lineDiv.style.backgroundPositionX = "0%";
        });
        // set the state to reflect this.
        this.setState({backgroundMode: BackgroundMode.Solid, color1: color2});
      }

      window.setTimeout(() => {
        // both sides big (middle ground)
        this.setClipState(2);
        // Gradient, begin sweeping over to other side
        lineDiv.style.backgroundPositionX = "0%";
        window.setTimeout(() => {
          // and back to normal
          this.setClipState(0);
          window.setTimeout(onComplete, SPEED*7/3);
        }, SPEED);
      }, SPEED);

      
      
      
      
    }
  
    render() {
      // Get and apply position values
      const {top, left, length, angle} = this;
      // transform information
      const styleMain = {
        top, left, width: `${length}px`,
        transform: `rotate(${angle}deg)`,
        borderWidth: "0px",
        borderColor: this.state.color1,
      }

      let styleInner;
      const color1 = this.state.color1;
      const color2 = this.state.color2;
      // We need to render styles differently based on whether the current edge is in Solid or Gradient mode.
      if (this.state.backgroundMode == BackgroundMode.Solid) {
        // most of the time, it seems
        styleInner = { backgroundColor: this.state.color1 };
      } else if (this.state.backgroundMode == BackgroundMode.Gradient) {
        styleInner = { backgroundImage: `linear-gradient(90deg, ${color1} 0%, ${color1})33%, {color2}67%, ${color2}100%`}
      }
    
      styleInner.clipPath = this.clipStates[this.state.clipState];
      
      return (
        <div key={"vertex" + this.props.p1.state.index1 + "/" + this.props.p2.state.index1}  ref={this.colorRef}  className="edge" style={styleMain}>
          <div className="edge_arrow"></div><div className="edge_inner" style={styleInner}></div>    
        </div>
      )
    }
  
  
  }

  export {
    Edge,
    BackgroundMode
  }

