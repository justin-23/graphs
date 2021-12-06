import { timeStamp } from 'console';
import React from 'react';


// Board passes down an object through which we are able to modify
// the Board state.
interface GUIProps {up: {set: Function, run: Function}} 
interface GUIState {mode: string, speed: number}

class GUI extends React.Component<GUIProps, GUIState> {
  constructor (props: any) { 
    super(props);
    
    this.state = {
      mode: "EDIT",
      speed: 1,
    }    
  }

  onclick_editmode = (e) => {
    this.props.up.set('editmode', e.target.textContent.toUpperCase())
  }

  onclick_mode = e => {
    this.setState({mode: e.target.textContent.toUpperCase()});
    this.props.up.set('mode', e.target.textContent.toUpperCase());
  }

  onclick_runmode = e => {
    this.props.up.set('testmode', e.target.textContent.toUpperCase());
  }

  onclick_run = (e) => {
    this.props.up.run();
  }

  onclick_speed = (e) => {
    let speed = (this.state.speed + 1) % 3;
    this.setState({speed});
    this.props.up.set('speed', speed);
    let speedMS = 0.5 - 0.12 * speed - 0.03 * speed * speed;
    document.documentElement.style.setProperty('--transition-time',  speedMS + "s");
  }

  render() {
    let guiEditStyle = {
      
    }
    return (
      <div className="guiOuter">
        <div className={"guiCategory guiEdit " + (this.state.mode == "EDIT" ? "" : "disable")}>
          <div className="clickElement" onClick={((e) => this.onclick_editmode(e))}>New</div>
          <div className="clickElement" onClick={this.onclick_editmode}>Delete</div>
          <div className="clickElement" onClick={this.onclick_editmode}>Connect</div>
          <div className="clickElement" onClick={this.onclick_editmode}>Set Start</div>
          <div className="clickElement" onClick={this.onclick_editmode}>Set Goal</div>
        </div>
        <div className="guiCategory guiMode">
          <div className="clickElement clickMedium" onClick={this.onclick_mode}>Edit</div>
          <div className="clickElement clickMedium" onClick={this.onclick_mode}>Test</div>
        </div>
        <div className={"guiCategory guiTest " + (this.state.mode == "TEST" ? "" : "disable")}>
          <div className="clickElement" onClick={this.onclick_runmode}>DFS</div>
          <div className="clickElement" onClick={this.onclick_runmode}>BFS</div>
          <div className="clickElement clickImportant" onClick={(e) => this.onclick_run(e)}>Run</div>
          <div className="clickElement" onClick={this.onclick_speed}>{"Speed: " + this.state.speed}</div>
        </div>
      </div>
    
    )
  }
}

export default GUI;