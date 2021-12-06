import { url } from 'inspector';
import React from 'react';
import Color from './Color';
import { Vertex } from './Vertex';

function copy<T>(obj: T) : T {
    return JSON.parse(JSON.stringify(obj));
}

interface VertexColorProps {
    color: string;
    vertexId: string;
}


class VertexColor extends React.Component<VertexColorProps, VertexColorProps> {
    constructor(props) {
        super(props);

        this.state = copy<VertexColorProps>(props);
        this.colorRef = React.createRef();

    }

    colorRef;
    vertexcolor_onmouse(e) {
        e.preventDefault();
    }

    
    componentDidMount() {
        console.log("Mounted");
    }

    fadeTo (color: string) {
        const div = this.colorRef.current;
        this.setColor(color);
        div.style.backgroundColor = color;
      
    }   

    
    render() {
        const style = {
            background: this.state.color,
            ["clip-path"]: `url(${this.state.vertexId})`,
        }
        return (
            <div ref={this.colorRef} className="vertexColor" style={style}
            onMouseUp={(e) => this.vertexcolor_onmouse(e)}
            onMouseDown={(e) => this.vertexcolor_onmouse(e)}
            ></div>
        )
    }
    styleInstantly(el: HTMLElement, f: Function) {
        // https://stackoverflow.com/questions/11131875/what-is-the-cleanest-way-to-disable-css-transition-effects-temporarily
        el.classList.add('notransition');
        f();
        let x = el.offsetHeight;
    }
    setColor(color: string) {
        console.log("THIS", this);
        /*this.setState({color}, () => {
            console.log("Set color to ", color, ", state now: ", this.state);
        });*/
        this.state = {color, vertexId: this.state.vertexId};
        console.log("attempted set color")
    }

    reset() {
        const el = this.colorRef.current;
       //this.styleInstantly(el, () => {
        this.fadeTo(Color.Default);
       // });
    }
}

export default VertexColor;