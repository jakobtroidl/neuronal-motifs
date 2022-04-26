import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'
import QueryBuilder from './QueryBuilder'
import CircleTwoToneIcon from '@mui/icons-material/CircleTwoTone';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import paper from 'paper'
import {AppContext} from "../contexts/GlobalContext";
import _ from 'lodash';
import {Grid, Icon, IconButton, Popover, Tooltip} from '@mui/material';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faHand} from '@fortawesome/free-solid-svg-icons'


function SketchPanel() {

    const sketchPanelId = "sketch-panel";
    let [nodes, setNodes] = useState([])
    let [edges, setEdges] = useState([])
    // States are node (add nodes), edge (add edges), edit(change node/edge properties)
    let [mouseState, setMouseState] = useState('node');
    let [cursor, setCursor] = useState('crosshair');
    let [pencil, setPencil] = useState();
    // Checks for mouse intersections
    let [testCircle, setTestCircle] = useState();
    // Edit properties with boolean query builder
    const [popperLocation, setPopperLocation] = React.useState()
    const [showPopper, setShowPopper] = React.useState(false);
    let circleRadius = 20;
    let currentPath;
    let currentNode;
    let currentSelection;

    // We track the overall motif in the global context
    const context = useContext(AppContext);


    const clearSketch = () => {
        console.log('Clearing')
        paper?.project?.activeLayer?.removeChildren();
        paper?.view?.draw();
        // Remove all edges and nodes
        setNodes([]);
        setEdges([]);

    }
    const bindPencilEvents = () => {
        currentPath = null;
        pencil.onMouseMove = function (event) {
            let point = new paper.Point(event.point);
            testCircle.position = point;
            if (mouseState === 'node') {
                if (context.selectedSketchElement) context.setSelectedSketchElement(null);
                let numNodes = nodes?.length || 0;
                let color = numNodes <= context.colors.length ? context.colors[numNodes] : '#000000';
                // Create new Circle
                if (!currentPath) {
                    currentPath = new paper.Path.Circle(point, circleRadius);
                    currentPath.strokeColor = '#000000';
                    currentPath.strokeWidth = 3;
                    currentPath.fillColor = color;
                    currentPath.opacity = 0.5;

                } else {
                    // Move existing circle
                    currentPath.position = point;
                }
            } else if (mouseState === 'edge') {
                if (context.selectedSketchElement) context.setSelectedSketchElement(null);
                if (!currentPath) {
                    currentPath = new paper.Path();
                    currentPath.strokeColor = '#000000';
                    currentPath.strokeWidth = 3
                    currentPath.opacity = 0.5;
                    currentPath.add([point.x - 10, point.y]);
                    currentPath.add([point.x + 10, point.y]);
                }
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                // Starting Point of Edge
                if (intersections === -1 && currentNode) {
                    currentPath.segments[0].point = currentNode.circle.getNearestPoint(point);
                    currentPath.segments[1].point = point;
                }   //    Ending Point of Edge
                else if (intersections !== -1 && currentNode && !_.isEqual(currentNode, nodes[intersections])) {
                    currentPath.segments[0].point = currentNode.circle.getNearestPoint(nodes[intersections].circle.position);
                    currentPath.segments[1].point = nodes[intersections].circle.getNearestPoint(currentNode.circle.position);
                }  // Otherwise move the line glyph
                else {
                    currentPath.segments[0].point = new paper.Point([point.x - 10, point.y]);
                    currentPath.segments[1].point = new paper.Point([point.x + 10, point.y]);
                }
            } else if (mouseState === 'edit') {
                // Check with intersections with nodes
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                // Check with intersections with nodes
                if (intersections !== -1) {
                    currentSelection = nodes[intersections];
                    return;
                }
                // Check with intersections with edges
                intersections = _.findLastIndex(edges.map(e => {
                    return !_.isEmpty(testCircle?.getIntersections(e.edgeLine));
                }), e => e === true);
                if (intersections !== -1) {
                    currentSelection = edges[intersections];
                    return
                }
                currentSelection = null;
            } else if (mouseState === 'move') {
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                // Check with intersections with nodes
                if (intersections !== -1) {
                    currentSelection = nodes[intersections];
                    nodes[intersections].circle.selected = true;
                } else {
                    currentSelection = null;
                    paper.project.activeLayer.selected = false;
                }
            }
        }
        pencil.onMouseDown = function (event) {
            let point = new paper.Point(event.point);
            if (mouseState === 'node') {
                if (!currentPath) return;
                // Create new node
                let numNodes = nodes?.length || 0;
                let circle = currentPath.clone();
                circle.opacity = 1;
                let textPoint = [circle.position.x, circle.position.y + 7]
                let label = new paper.PointText({
                    point: textPoint,
                    justification: 'center',
                    fillColor: 'white',
                    font: "Roboto",
                    fontSize: 20
                });
                let labelLetter = String.fromCharCode(65 + numNodes);
                label.content = labelLetter;
                currentPath?.remove();
                currentPath = null;
                let circleGroup = new paper.Group([circle, label]);
                setNodes(nodes => [...nodes, {
                    circle: circle,
                    label: labelLetter,
                    properties: null,
                    type: 'node',
                    circleGroup: circleGroup
                }]);
            } else if (mouseState == 'edge') {
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                if (intersections !== -1 && !currentNode && currentPath) {
                    currentNode = nodes[intersections]
                    currentPath.segments[0].position = (currentNode.circle.getNearestPoint(point));
                    return;
                } else if (currentPath && intersections !== -1) {
                    if (!_.isEqual(currentNode, nodes[intersections])) {
                        // If line intersects with two nodes, draw edge
                        currentPath.segments[0].point = currentNode.circle.getNearestPoint(nodes[intersections].circle.position)
                        currentPath.segments[1].point = nodes[intersections].circle.getNearestPoint(currentNode.circle.position);
                        let edge = currentPath.clone();
                        edge.opacity = 1;
                        addEdge(currentNode, nodes[intersections], edge);
                    }
                }
                currentPath?.remove();
                currentNode = null;
                currentPath = null;
            } else if (mouseState == 'edit') {

                let nodeIntersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);

                let edgeIntersections = _.findLastIndex(edges.map(e => {
                    return !_.isEmpty(testCircle?.getIntersections(e.edgeLine));
                }), e => e === true);
                // select the clicked on element and show the popper
                if (nodeIntersections !== -1 || edgeIntersections !== -1) {
                    context.setSelectedSketchElement(currentSelection);
                    let selectedElement = (currentSelection?.lineGroup || currentSelection?.circle)
                    paper.project.activeLayer.selected = false;
                    selectedElement.selected = true;
                    setShowPopper(true);
                } else {
                    // If they click out, make the popper go away
                    setShowPopper(false);
                    context.setSelectedSketchElement(null);
                    setPopperLocation(null);
                }
            } else if (mouseState === 'move') {
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                // Check with intersections with nodes
                if (intersections !== -1) {
                    currentSelection = nodes[intersections];
                }
                if (currentSelection) {
                    setCursor('grabbing')
                }
            }
        }
        pencil.onMouseUp = function (event) {
            if (mouseState === 'move') {
                console.log('grab', currentNode);

                let nodeIndex = _.findLastIndex(nodes.map(n => n.label === currentNode.label));
                // // list of edges including this edge
                let tmpEdges = _.clone(edges);
                let edgesToAddAgain = []
                let filteredEdges = tmpEdges.filter(e => {
                    if (e.indices.includes(nodeIndex)) {
                        edgesToAddAgain.push(e);
                        return false;
                    }
                    return true;
                })
                let newEdges = edgesToAddAgain.map(e => {
                    e.edgeLine.opacity = 1;
                    return createEdge(e.fromNode, e.toNode, e.edgeLine, e.indices);
                })

                setEdges([...newEdges, ...filteredEdges]);


                setCursor('grab');
            }
        }
        pencil.onMouseDrag = function (event) {
            if (mouseState === 'move') {
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                // Check with intersections with nodes
                if (intersections === -1) return;
                nodes[intersections].circleGroup.position = new paper.Point(event.point);
                currentNode = nodes[intersections]

                edges.forEach((e, i) => {
                        if (e.indices.includes(intersections)) {
                            if (e.lineGroup) {
                                edges[i].edgeLine.remove()
                                edges[i].lineGroup.remove();
                                edges[i].edgeLine = null;
                                edges[i].edgeLine = null;
                                edges[i].oppositeEdge = null;
                                edges[i].edgeLine = new paper.Path();
                                edges[i].edgeLine.strokeColor = '#000000';
                                edges[i].edgeLine.strokeWidth = 3
                                edges[i].edgeLine.opacity = 0.5;
                                edges[i].edgeLine.add([0, 0]);
                                edges[i].edgeLine.add([0, 0]);
                            }
                            edges[i].edgeLine.segments[0].point = nodes[e.indices[0]].circle.getNearestPoint(nodes[e.indices[1]].circle.position)
                            edges[i].edgeLine.segments[1].point = nodes[e.indices[1]].circle.getNearestPoint(nodes[e.indices[0]].circle.position)
                        }
                    }
                )

            }
        }
    }
    const addEdge = ((fromNode, toNode, edgeLine) => {
        let nodeIndices = [_.findLastIndex(nodes, fromNode), _.findLastIndex(nodes, toNode)];
        let matchingEdge = _.findIndex(edges, (e) => {
            return _.isEqual(e.indices, nodeIndices);
        })
        if (matchingEdge !== -1) {
            console.log('Edge Exists')
            edgeLine.remove();
            return;
        }
        const newEdgeObj = createEdge(fromNode, toNode, edgeLine, nodeIndices);

        setEdges([...edges, newEdgeObj])
    })

    const createEdge = ((fromNode, toNode, edgeLine, nodeIndices) => {

        let edgeObj = {'indices': nodeIndices, 'toNode': toNode, 'fromNode': fromNode, 'edgeLine': edgeLine}
        // If this edge already exists, don't create it

        // Checks from an edge going the opposite direction between the same two nodes
        let origToPoint = _.cloneDeep(edgeLine.segments[0].point);
        let circ = new paper.Path.Circle(origToPoint, 8);
        let toPoint = edgeLine.segments[0].point = circ.getIntersections(edgeLine)[0].point;
        circ.remove()
        let origFromPoint = _.cloneDeep(edgeLine.segments[1].point);
        circ = new paper.Path.Circle(origFromPoint, 8);
        let fromPoint = edgeLine.segments[1].point = circ.getIntersections(edgeLine)[0].point;
        const dy = toPoint.y - fromPoint.y;
        const dx = toPoint.x - fromPoint.x;
        const theta = Math.atan2(dy, dx); // range (-PI, PI]
        const newY = (7 * Math.sin(theta)) + fromPoint.y;
        const newX = (7 * Math.cos(theta)) + fromPoint.x;
        let circle = new paper.Path.Circle([newX, newY], 7)
        // Check where the arrow head points should be
        let secondCircle = new paper.Path.Circle(circle.getNearestPoint(toPoint), 7)
        let intersections = secondCircle.getIntersections(circle).map(intersection => intersection.point);
        intersections.splice(1, 0, fromPoint)
        let trianglePath = new paper.Path(intersections);
        trianglePath.strokeColor = 'black';
        trianglePath.strokeWidth = 3;
        trianglePath.strokeJoin = 'round';
        // Create a big group with line and arrow
        edgeObj['toPoint'] = toPoint;
        edgeObj['fromPoint'] = fromPoint;
        edgeObj['lineGroup'] = new paper.Group([trianglePath, edgeObj.edgeLine]);
        secondCircle?.remove();
        circle?.remove();
        edgeObj['type'] = 'edge';
        edgeObj['label'] = `${edgeObj.fromNode.label} -> ${edgeObj.toNode.label}`
        return edgeObj
    })

    const getNodeLocations = () => {
        return nodes.map(n => {
            return {'label': n.label, 'position': n.circle.position}
        });
    }

    // Checks for edges going opposite to each other and offsets them so they are distinguishable
    useEffect(() => {
        if (!edges) return;
        edges.forEach((e, i) => {
            let oppositeEdge = _.findIndex(edges, (oppE) => {
                return _.isEqual(oppE.indices, [e.indices[1], e.indices[0]]);
            });
            if (oppositeEdge !== -1 && !e.oppositeEdge && oppositeEdge > i) {
                let midpoint = new paper.Point([(e.toPoint.x + e.fromPoint.x) / 2, (e.toPoint.y + e.fromPoint.y) / 2])
                let circle1 = new paper.Path.Circle(midpoint, 5);
                let circle2 = new paper.Path.Circle(circle1.getIntersections(edges[oppositeEdge].edgeLine)[0].point,
                    Math.sqrt(5 ** 2 + 5 ** 2));
                let pointDelta = circle2.getIntersections(circle1).map(e => e.point).sort((a, b) => {
                    return a.y - b.y;
                }).map(pt => new paper.Point([midpoint.x - pt.x, midpoint.y - pt.y]));
                e['lineGroup'].translate(pointDelta[0]);
                edges[oppositeEdge]['lineGroup'].translate(pointDelta[1]);
                edges[oppositeEdge]['oppositeEdge'] = i;
                e['oppositeEdge'] = oppositeEdge;
            }
        })
    }, [edges])

    useEffect(() => {
        if (pencil && mouseState) {
            // Rebind the pencil events whenever new nodes are drawn
            bindPencilEvents();
        }
    }, [pencil, mouseState, nodes, edges])
    useEffect(() => {
        currentPath?.remove();
        setPopperLocation(null);
        setShowPopper(false);
        if (paper?.project?.activeLayer) {
            paper.project.activeLayer.selected = false;
            // Remove all undrawn shapes when you switch modes
            paper.project.activeLayer.children.forEach(child => {
                if (child.opacity === 0.5) child.remove();
            })
        }

    }, [mouseState])
    useEffect(() => {
        if (context.selectedSketchElement) {
            let paperElement = context.selectedSketchElement?.circle || context?.selectedSketchElement?.edgeLine;
            // Calculate where on screen coordinates the popper should go
            let position = paperElement.getPosition();
            let boundingRect = paper.view.element.getBoundingClientRect();
            if (paperElement && position) {
                setPopperLocation({
                    top: position.y + boundingRect.top + 30,
                    left: position.x + boundingRect.left - 30
                })
            }
            if (context.selectedSketchElement.type === 'edge') {
                setEdges(edges.map(e => {
                    // Update the edge with the query properties
                    if (_.isEqual(e.edgeLine, context.selectedSketchElement.edgeLine)) {
                        e.tree = context.selectedSketchElement.tree;
                        e.properties = context.selectedSketchElement.properties;
                    }
                    return e
                }));
            } else {
                setNodes(nodes.map(n => {
                    if (_.isEqual(n.circle, context.selectedSketchElement.circle)) {
                        // Update the node with the query properties
                        n.tree = context.selectedSketchElement.tree;
                        n.properties = context.selectedSketchElement.properties;
                    }
                    return n
                }));
            }
        } else {
            setPopperLocation(null);
        }
    }, [context.selectedSketchElement])
    // On init set up our paperjs
    useEffect(() => {
        paper.setup(sketchPanelId);
        let tempCircle = new paper.Path.Circle([0, 0], 6);
        tempCircle.fill = 'none';
        tempCircle.strokeWidth = 0;
        setTestCircle(tempCircle);
        setPencil(new paper.Tool());
    }, []);
    // Update global motif tracker
    useEffect(() => {
        if (edges) {
            console.log('Edges', edges);
        }

    }, [edges])
    // Encode the Nodes and Edges For Query
    useEffect(() => {
        let encodedNodes = nodes.map((n, i) => {
            return {label: n.label, properties: n.properties, index: i}
        });
        let encodedEdges = edges.map((e, i) => {
            return {label: e.label, properties: e.properties, index: i, indices: e.indices}
        })
        context.setMotifQuery({nodes: encodedNodes, edges: encodedEdges})
    }, [nodes, edges])

    return (
        <div className='sketch-panel-style'>
            <Grid container className="canvas-wrapper" spacing={0}>
                <Grid item xs={11}>
                    <div className="sketch-canvas" style={{cursor: cursor || 'crosshair'}}>
                        <canvas id={sketchPanelId}></canvas>
                        {showPopper && popperLocation && context.selectedSketchElement &&
                        < Popover
                            anchorReference="anchorPosition"
                            open={true}
                            hideBackdrop={true}
                            className={'sketch-popover'}
                            disableEnforceFocus={true}
                            anchorPosition={popperLocation}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                        >
                            <Grid
                                container
                                className={'popover-grid'}
                                direction="column"
                                justifyContent="center"
                                alignItems="flex-start"
                                style={{position: 'absolute', height: '40.75px'}}
                            >
                                    <span style={{paddingLeft: 10, fontWeight: 'bold', color: '#454545'}}>
                                        {_.capitalize(context.selectedSketchElement.type)} {context.selectedSketchElement.label}
                                    </span>

                            </Grid>

                            <QueryBuilder/>
                        </Popover>
                        }
                    </div>
                </Grid>
                <Grid item xs={1}>
                    <Grid
                        container
                        direction="column"
                        style={{position: 'absolute', height: 'auto', width: 'auto'}}>
                        <Tooltip title="Draw Node" placement="right">
                            <IconButton value='node' color={mouseState === 'node' ? "primary" : "default"}
                                        onClick={() => {
                                            currentPath?.remove();
                                            setCursor('crosshair')
                                            setMouseState('node')
                                        }}>
                                <CircleTwoToneIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Draw Edge" placement="right">
                            <IconButton color={mouseState === 'edge' ? "primary" : "default"}
                                        onClick={() => {
                                            currentPath?.remove();
                                            setCursor('crosshair')
                                            setMouseState('edge')
                                        }}>
                                <ArrowRightAltIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Clear Sketch" placement="right">
                            <IconButton color="default"
                                        onClick={() => {
                                            setCursor('crosshair')
                                            clearSketch()
                                        }}>
                                <DeleteIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Edit Properties" placement="right">
                            <IconButton value='edit' color={mouseState === 'edit' ? "primary" : "default"}
                                        onClick={() => {
                                            setCursor('pointer')
                                            currentPath?.remove();
                                            setMouseState('edit');
                                        }}>
                                <EditIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Move" placement="right">
                            <IconButton value='edit' color={mouseState === 'move' ? "primary" : "default"}
                                        onClick={() => {
                                            setCursor('grab')
                                            currentPath?.remove();
                                            setMouseState('move');
                                        }}>
                                <FontAwesomeIcon style={{height: '0.95em', width: '0.95em'}} icon={faHand}/>
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Grid>


        </div>
    )
}

export default SketchPanel;