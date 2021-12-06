import React from 'react';
import VertexColor from './VertexColor';
import Color from './Color';
interface VertexProps {
    p: {
        x: number,
        y: number,
    },
    color: string,
    index1: number,
    colorComponent: VertexColor,
    isStart: boolean,
    isGoal: boolean,
}
  
interface VertexState { 
    
};
function copy<T>(obj: T) : T {
    return JSON.parse(JSON.stringify(obj));
}

class Vertex extends React.Component<VertexProps, VertexProps> {

    static default(index1: number, x: number, y: number) {
        return new Vertex({
            index1,
            p: {
                x, y,
            },
            color: Color.Default,
            colorComponent: new VertexColor({color: Color.Default, vertexId: index1}),
            isStart: false,
        })
    }

    static totalEverMade: number = 0;
    
    colorRef;
    constructor(props) {
        super(props);
        const {index1, p: {x, y}, color, colorComponent, isStart, isGoal } = props;
        this.state = {
            index1, p: {x, y}, color, colorComponent, isStart, isGoal,
        }//;copy<VertexProps>(props); 
       // this.colorRef = React.createRef();
    }

    componentWillMount() {
        this.fadeTo("orange");
    }
    
    decrementIndex() : void {
        this.setState({index1: this.state.index1 - 1,})
    }

    setStart() : void {
        if (this.state) {
            this.setState({isStart: true}, function() {
                console.log("set state successfully");
            });
        } else {
            //
        }

        console.log('tried to set state');
    }

    unsetStart() {
        if (this.state) {
            this.setState({isStart: false});
        } else {
            //this.state.isStart = false;
        }
    }

    setGoal() : void {
        if (this.state) {
            this.setState({isGoal: true}, function() {
                console.log("set state successfully");
            });
        } else {
            //
        }

        console.log('tried to set state');
    }

    unsetGoal() {
        if (this.state) {
            this.setState({isGoal: false});
        } else {
            //this.state.isStart = false;
        }
    }

    
    vertex_onmouse(e) : void {
        //console.log("vertex  clicked: id ", this.props.index1);
        e.preventDefault();
        e.vertexId = this.props.index1;
    }
    
    spacer_onclick(e) : void{
      e.preventDefault();
      e.hitSpacer = true;
    }

    fadeTo (color: string) {

        this.state.colorComponent.fadeTo(color);
       
        const obj = {};
        Object.assign(obj, this.state, {color});

        this.state = obj as VertexProps;
    }

    renderVertexColor()  {
        return this.props.colorComponent.render();
    }

    reset() {
        this.state.colorComponent.reset();
        this.setState({color: Color.Default });
    }

    render() {
        return (
            <div
                key={"vertex" + Vertex.totalEverMade++} 
                className="vertexOuter"
                style={{
                    left: this.props.p.x,
                    top: this.props.p.y,
                }}
            >
              {this.renderVertexColor()}

            <div className={"vertex" + (this.state.isStart ? " startVertex" : "")} id={"vertex" + this.props.index1} 
                onMouseUp={(e) => this.vertex_onmouse(e)}
                onMouseDown={(e) => this.vertex_onmouse(e)}
                
            >
                <div className="vertexSpacer" onMouseDown={(e) => this.spacer_onclick(e)}></div>
            </div>
        
        </div>
      )
    }
}

export {
    Vertex, Color
};

