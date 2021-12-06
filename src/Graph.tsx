import { EEXIST } from 'constants';
import { Edge } from './Edge';
import Color from './Color';
import { AnimationType, StepEntry, Step} from './Step';
import { PassThrough } from 'stream';
import { format } from 'path';
interface GraphData {
    edgeInfo: number[][];
    size: number;
}
class Graph implements GraphData {

    size: number;
    edgeInfo: number[][];
    constructor(edges: Edge[][]) {
        this.edgeInfo = edges.map((row: Edge[]) => {
            return row.map((e: Edge) => {
                return e.getIndex2();
            });
        })
        this.size = edges.length;
    }

    /*
        The graph class stores the transition table and it's size as properties. 
        When we run algorithms, we acess the board through 'this'
        The return value of any algorithm function should be an array of steps. Each step represents one "action". 
        */
     
    fadeVertex(time: number, index1: number, color1: string) : Step {
        return {
            frames: [
                {
                    time, index1, color1, animationType: AnimationType.FadeVertex,
                }
            ]
        }
    }
    /*runBreadthFirstSearch(time: number, start: number, goal: number, color: string) : Step[] {
        console.log("running");
        if ((!this.edgeInfo[start]) || start < 0 || start > this.size) {
            throw Error("fill in");
        }

        const seen: number[] = [start];
        const queue: number[] = [start];
        let steps: Step[] = [this.fadeVertex(time, start, color)];
        while (queue.length) {
            let from = queue.pop() as number;
            this.edgeInfo[from].forEach((to: number) => {
                if (seen.indexOf(to) < 0) {
                    seen.push(to);
                    let s: Step =  {
                        frames: [
                            {
                                time,
                                index1: from,
                                index2: to,
                                color1: color,
                                color2: Color.Red,
                                animationType: AnimationType.SweepForward,
                            }
                        ]
                    };
                    steps.push(s);
                   queue.unshift(to);
                }
            })
        }
        return steps;
    }*/

    runDepthFirstSearch(time: number, start: number,  goal: number, color: string) : Step[]{

        if ((!this.edgeInfo[start]) || start < 0 || start > this.size) {
            throw Error("fill in");
        }

        const seen: number[] = [start];
        const stack: number[] = [start];
        let next;
        let steps: Step[] = [this.fadeVertex(time, start, color)];


        let doSearch = (from: number, goal: number, steps: Step[], stack:number[], output: number[][]) : void => {
            //let paths: number[][] = [];
            let returnVal: number[] = [];
            this.edgeInfo[from].forEach((to: number) => {
                let newStack = [...stack, to];
                if (seen.indexOf(to) < 0) {
                    seen.push(to);
                    let s: Step =  {
                        frames: [
                            {
                                time,
                                index1: from,
                                index2: to,
                                color1: color,
                                color2: Color.Red,
                                animationType: AnimationType.SweepForward,
                            }
                        ]
                    };
                    steps.push(s);
                    if (to == goal) {
                        output.push(newStack);
                    }
                    doSearch(to, goal, steps, newStack, output);
                    //([from, ...doSearch(to, goal, steps)]);
                
                }
            });
            
            //return paths.find((arr: number[]) => arr.length > 0) || [];
        }    
        let results: number[][] = []
        doSearch(start, goal, steps, [start], results);
        let found: number[] = results[0] || [];
        steps.push(this.fadeVertex(time, start, Color.Green));
        for (let i = 0; i < found.length - 1; i++) {
            let s: Step = {
                frames: [{
                    time,
                    index1: found[i],
                    index2: found[i+1],
                    color1: Color.Green,
                    color2: Color.Red,
                    animationType: AnimationType.SweepForward,
                }]
            };

            steps.push(s);
        }
        console.log(found);
        return steps;
        
    }

    runBreadthFirstSearch(time: number, start: number,  goal: number, color: string) : Step[]{

        if ((!this.edgeInfo[start]) || start < 0 || start > this.size) {
            throw Error("fill in");
        }

        const seen: number[] = [start];
        const stack: number[] = [start];
        let next;
        let steps: Step[] = [this.fadeVertex(time, start, color)];


        let doSearch = (from: number, goal: number, steps: Step[], stack:number[], output: number[][]) : void => {
            //let paths: number[][] = [];
            let returnVal: number[] = [];
            let tos: any[] = [];
            this.edgeInfo[from].forEach((to: number) => {
                let newStack = [...stack, to];
                if (seen.indexOf(to) < 0) {
                    seen.push(to);
                    let s: Step =  {
                        frames: [
                            {
                                time,
                                index1: from,
                                index2: to,
                                color1: color,
                                color2: Color.Red,
                                animationType: AnimationType.SweepForward,
                            }
                        ]
                    };
                    steps.push(s);
                    if (to == goal) {
                        output.push(newStack);
                    }
                    tos.push(to);
                    
                    //doSearch(to, goal, steps, newStack, output);
                    //([from, ...doSearch(to, goal, steps)]);
                
                }
            });
            tos.forEach((to: number) => {
                doSearch(to, goal, steps, [...stack, to], output);
            })
            
            //return paths.find((arr: number[]) => arr.length > 0) || [];
        }    
        let results: number[][] = []
        doSearch(start, goal, steps, [start], results);
        let found: number[] = results[0] || [];
        steps.push(this.fadeVertex(time, start, Color.Green));
        for (let i = 0; i < found.length - 1; i++) {
            let s: Step = {
                frames: [{
                    time,
                    index1: found[i],
                    index2: found[i+1],
                    color1: Color.Green,
                    color2: Color.Red,
                    animationType: AnimationType.SweepForward,
                }]
            };

            steps.push(s);
        }
        console.log(found);
        return steps;
    }
}
export default Graph;