/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

// Todo: This entire class should be converted to a module
var VecUtils = require("js/helper-classes/3D/vec-utils").VecUtils;
var GeomObj = require("js/lib/geom/geom-obj").GeomObj;

///////////////////////////////////////////////////////////////////////
// Class GLBrushStroke
//      representation a sequence points (polyline) created by brush tool.
//      Derived from class GLGeomObj
///////////////////////////////////////////////////////////////////////
var BrushStroke = function GLBrushStroke() {
    ///////////////////////////////////////////////////
    // Instance variables
    ///////////////////////////////////////////////////
    this._Points = [];
    this._BBoxMin = [0, 0, 0];
    this._BBoxMax = [0, 0, 0];
    this._dirty = true;

    //whether or not to use the canvas drawing to stroke/fill
    this._useCanvasDrawing = true;

    //the X and Y location of this subpath's canvas in stage world space of Ninja
    this._canvasX = 0;
    this._canvasY = 0;

    //stroke information
    this._strokeWidth = 0.0;
    this._strokeColor = [0.4, 0.4, 0.4, 1.0];
    this._secondStrokeColor = [1, 0.4, 0.4, 1.0];
    this._strokeHardness = 100;
    this._strokeMaterial = null;
    this._strokeStyle = "Solid";
    this._strokeDoSmoothing = false;
    this._strokeUseCalligraphic = false;
    this._strokeAngle = 0;
    this._strokeAmountSmoothing = 0;

    //threshold that tells us whether two samples are too far apart
    this._MAX_SAMPLE_DISTANCE_THRESHOLD = 5;

    //threshold that tells us whether two samples are too close
    this._MIN_SAMPLE_DISTANCE_THRESHOLD = 2;

    //prevent extremely long paths that can take a long time to render
    this._MAX_ALLOWED_SAMPLES = 500;

    //drawing context
    this._world = null;

    //tool that owns this brushstroke
    this._drawingTool = null;
    this._planeMat = null;
    this._planeMatInv = null;
    this._planeCenter = null;

    /////////////////////////////////////////////////////////
    // Property Accessors/Setters
    /////////////////////////////////////////////////////////
    this.setWorld = function (world) {
        this._world = world;
    };

    this.getWorld = function () {
        return this._world;
    };

    this.geomType = function () {
        return this.GEOM_TYPE_CUBIC_BEZIER;
    };

    this.setDrawingTool = function (tool) {
        this._drawingTool = tool;
    };

    this.getDrawingTool = function () {
        return this._drawingTool;
    };

    this.setPlaneMatrix = function(planeMat){
        this._planeMat = planeMat;
    };

    this.setPlaneMatrixInverse = function(planeMatInv){
        this._planeMatInv = planeMatInv;
    };

    this.setPlaneCenter = function(pc){
        this._planeCenter = pc;
    };

    this.getCanvasX = function(){
        return this._canvasX;
    };

    this.getCanvasY = function(){
        return this._canvasY;
    };

    this.setCanvasX = function(cx){
        this._canvasX=cx;
    };

    this.setCanvasY = function(cy){
        this._canvasY=cy;
    };

    this.getNumPoints = function () {
        return this._Points.length;
    };

    this.getPoint = function (index) {
        return this._Points[index];
    };

    this.addPoint = function (pt) {
        //add the point only if it is some epsilon away from the previous point
        var numPoints = this._Points.length;
        if (numPoints>0) {
            var threshold = this._MIN_SAMPLE_DISTANCE_THRESHOLD;
            var prevPt = this._Points[numPoints-1];
            var diffPt = [prevPt[0]-pt[0], prevPt[1]-pt[1]];
            var diffPtMag = Math.sqrt(diffPt[0]*diffPt[0] + diffPt[1]*diffPt[1]);
            if (diffPtMag>threshold){
                this._Points.push(pt);
                this._dirty=true;
            }
        } else {
            this._Points.push(pt);
            this._dirty=true;
        }
    };
    
    this.insertPoint = function(pt, index){
        this._Points.splice(index, 0, pt); this._dirty=true;
    };

    this.isDirty = function(){
        return this._dirty;
    };

    this.makeDirty = function(){
        this._dirty=true;
    };

    this.getBBoxMin = function () {
        return this._BBoxMin;
    };

    this.getBBoxMax = function () {
        return this._BBoxMax;
    };

    this.getStrokeWidth = function () {
        return this._strokeWidth;
    };

    this.setStrokeWidth = function (w) {
        this._strokeWidth = w;
        this._dirty=true;
    };

    this.getStrokeMaterial = function () {
        return this._strokeMaterial;
    };

    this.setStrokeMaterial = function (m) {
        this._strokeMaterial = m;
    };

    this.getStrokeColor = function () {
        return this._strokeColor;
    };

    this.setStrokeColor = function (c) {
        this._strokeColor = c;
    };

    this.setSecondStrokeColor = function(c){
        this._secondStrokeColor=c;
    }

    this.setStrokeHardness = function(h){
        this._strokeHardness=h;
    }

    this.setDoSmoothing = function(s){
        this._strokeDoSmoothing = s;
    }

    this.setSmoothingAmount = function(a){
        this._strokeAmountSmoothing = a;
    }

    this.setStrokeUseCalligraphic = function(c){
        this._strokeUseCalligraphic = c;
    }

    this.setStrokeAngle = function(a){
        this._strokeAngle = a;
    }

    this.getStrokeStyle = function () {
        return this._strokeStyle;
    };

    this.setStrokeStyle = function (s) {
        this._strokeStyle = s;
    };

    this.setWidth = function () {

    };//NO-OP for now

    this.setHeight = function () {

    };//NO-OP for now


    //remove and return anchor at specified index, return null on error
    this.removePoint = function (index) {
        var retAnchor = null;
        if (index < this._Points.length) {
            retPt = this._Points.splice(index, 1);
            this._dirty=true;
        }
        return retPoint;
    };

    //remove all the points
    this.clear = function () {
        this._Points = [];
        this._dirty=true;
    }

    this.translate = function (tx, ty, tz) {
        for (var i=0;i<this._Points.length;i++){
            this._Points[i][0]+=tx;
            this._Points[i][1]+=ty;
            this._Points[i][2]+=tz;
        }
    };

    this.computeMetaGeometry = function() {
        if (this._dirty) {
            var numPoints = this._Points.length;

            //**** add samples to the path if needed...linear interpolation for now
            //if (numPoints>1) {
            if (0){
                var threshold = this._MAX_SAMPLE_DISTANCE_THRESHOLD;
                var prevPt = this._Points[0];
                var prevIndex = 0;
                for (var i=1;i<numPoints;i++){
                    var pt = this._Points[i];
                    var diff = [pt[0]-prevPt[0], pt[1]-prevPt[1]];
                    var distance = Math.sqrt(diff[0]*diff[0]+diff[1]*diff[1]);
                    if (distance>threshold){
                        //insert points along the prev. to current point
                        var numNewPoints = Math.floor(distance/threshold);
                        for (var j=0;j<numNewPoints;j++){
                            var param = (j+1)/(numNewPoints+1);
                            var newpt = [prevPt[0]+ diff[0]*param, prevPt[1]+ diff[1]*param];
                            //insert new point before point i
                            this._Points.splice(i, 0, [newpt[0], newpt[1], 0]);
                            i++;
                        }
                        this._dirty=true;
                    }
                    prevPt=pt;
                    //update numPoints to match the new length
                    numPoints = this._Points.length;

                    //end this function if the numPoints has gone above the max. size specified
                    if (numPoints> this._MAX_ALLOWED_SAMPLES){
                        console.log("leaving the resampling because numPoints is greater than limit:"+this._MAX_ALLOWED_SAMPLES);
                        break;
                    }
                }
            }

            //instead of the following, may use 4-point subdivision iterations over continuous regions of 'long' segments
            // look at http://www.gvu.gatech.edu/~jarek/Split&Tweak/ for formula
            //**** add samples to the long sections of the path --- Catmull-Rom spline interpolation
            if (this._strokeDoSmoothing && numPoints>1) {
                var numInsertedPoints = 0;
                var newPoints = [];
                var threshold = this._MAX_SAMPLE_DISTANCE_THRESHOLD;//this determines whether a segment between two sample is long enough to warrant checking for angle
                var prevPt = this._Points[0];
                newPoints.push(this._Points[0]);
                for (var i=1;i<numPoints;i++){
                    var pt = this._Points[i];
                    var diff = [pt[0]-prevPt[0], pt[1]-prevPt[1]];
                    var distance = Math.sqrt(diff[0]*diff[0]+diff[1]*diff[1]);
                    if (distance>threshold){
                        //build the control polygon for the Catmull-Rom spline (prev. 2 points and next 2 points)
                        var prev = (i===1) ? i-1 : i-2;
                        var next = (i===numPoints-1) ? i : i+1;
                        var ctrlPts = [this._Points[prev], this._Points[i-1], this._Points[i], this._Points[next]];
                        //insert points along the prev. to current point
                        var numNewPoints = Math.floor(distance/threshold);
                        for (var j=0;j<numNewPoints;j++){
                            var param = (j+1)/(numNewPoints+1);
                            var newpt = this._CatmullRomSplineInterpolate(ctrlPts, param);
                            //insert new point before point i
                            //this._Points.splice(i, 0, newpt);
                            //i++;
                            newPoints.push(newpt);
                            numInsertedPoints++;
                        }
                        this._dirty=true;
                    }
                    newPoints.push(pt);
                    prevPt=pt;
                    //update numPoints to match the new length
                    numPoints = this._Points.length;

                    //end this function if the numPoints has gone above the max. size specified
                    if (numPoints> this._MAX_ALLOWED_SAMPLES){
                        console.log("leaving the resampling because numPoints is greater than limit:"+this._MAX_ALLOWED_SAMPLES);
                        break;
                    }
                }
                this._Points = newPoints;
                numPoints = this._Points.length;
                console.log("Inserted "+numInsertedPoints+" additional CatmullRom points");

                //now do 3-4 iterations of Laplacian smoothing (setting the points to the average of their neighbors)
                var numLaplacianIterations = this._strokeAmountSmoothing; 
                for (var n=0;n<numLaplacianIterations;n++){
                    newPoints = this._Points;
                    for (var i=1;i<numPoints-1;i++){
                        var avgPos = [  0.5*(this._Points[i-1][0] + this._Points[i+1][0]),
                                        0.5*(this._Points[i-1][1] + this._Points[i+1][1]),
                                        0.5*(this._Points[i-1][2] + this._Points[i+1][2])] ;
                        newPoints[i] = avgPos;
                    }
                    this._Points = newPoints;
                }
            }

            // *** compute the bounding box *********
            this._BBoxMin = [Infinity, Infinity, Infinity];
            this._BBoxMax = [-Infinity, -Infinity, -Infinity];
            numPoints = this._Points.length;
            if (numPoints === 0) {
                this._BBoxMin = [0, 0, 0];
                this._BBoxMax = [0, 0, 0];
            } else {
                for (var i=0;i<numPoints;i++){
                    var pt = this._Points[i];
                    for (var d = 0; d < 3; d++) {
                        if (this._BBoxMin[d] > pt[d]) {
                            this._BBoxMin[d] = pt[d];
                        }
                        if (this._BBoxMax[d] < pt[d]) {
                            this._BBoxMax[d] = pt[d];
                        }
                    }//for every dimension d from 0 to 2
                }
            }

            //increase the bbox given the stroke width and the angle (in case of calligraphic brush)
            var bboxPadding = this._strokeWidth/2;
            if (this.__strokeUseCalligraphic) {
                this._BBoxMin[0]-= bboxPadding*Math.cos(this._strokeAngle);
                this._BBoxMin[1]-= bboxPadding*Math.sin(this._strokeAngle);
                this._BBoxMax[0]+= bboxPadding*Math.cos(this._strokeAngle);
                this._BBoxMax[1]+= bboxPadding*Math.sin(this._strokeAngle);
            } else {
                for (var d = 0; d < 3; d++) {
                    this._BBoxMin[d]-= bboxPadding;
                    this._BBoxMax[d]+= bboxPadding;
                }//for every dimension d from 0 to 2
            }
        }
        this._dirty = false;
    };

    this.buildBuffers = function () {
        //return; //no need to do anything for now
    };//buildBuffers()

    //render
    //  specify how to render the subpath in Canvas2D
    this.render = function () {
        // get the world
        var world = this.getWorld();
        if (!world)  throw( "null world in brushstroke render" );

         // get the context
        var ctx = world.get2DContext();
        if (!ctx)  throw ("null context in brushstroke render")

        var numPoints = this.getNumPoints();
        if (numPoints === 0) {
            return; //nothing to do for empty paths
        }

        ctx.save();

        this.computeMetaGeometry();
        var bboxMin = this.getBBoxMin();
        var bboxMax = this.getBBoxMax();
        var bboxWidth = bboxMax[0] - bboxMin[0];
        var bboxHeight = bboxMax[1] - bboxMin[1];
        ctx.clearRect(0, 0, bboxWidth, bboxHeight);

        if (this._strokeUseCalligraphic) {
            //build the stamp for the brush stroke
            var t=0;
            var numTraces = this._strokeWidth;
            var halfNumTraces = numTraces/2;
            var opaqueRegionHalfWidth = 0.5*this._strokeHardness*numTraces*0.01; //the 0.01 is to convert the strokeHardness from [0,100] to [0,1]
            var maxTransparentRegionHalfWidth = halfNumTraces-opaqueRegionHalfWidth;

            //build an angled (calligraphic) brush stamp
            var deltaDisplacement = [Math.cos(this._strokeAngle),Math.sin(this._strokeAngle)];
            deltaDisplacement = VecUtils.vecNormalize(2, deltaDisplacement, 1);
            var startPos = [-halfNumTraces*deltaDisplacement[0],-halfNumTraces*deltaDisplacement[1]];

            var brushStamp = [];
            for (t=0;t<numTraces;t++){
                var brushPt = [startPos[0]+t*deltaDisplacement[0], startPos[1]+t*deltaDisplacement[1]];
                brushStamp.push(brushPt);
            }

            ctx.lineJoin="bevel";
            ctx.lineCap="butt";
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = this._strokeColor[3];
            //ctx.lineWidth=this._strokeWidth/10;//todo figure out the correct formula for the line width
            //if (ctx.lineWidth<2)
            ctx.lineWidth=2;
            if (t===numTraces-1){
                ctx.lineWidth = 1;
            }

            for (t=0;t<numTraces;t++){
                var disp = [brushStamp[t][0], brushStamp[t][1]];
                var alphaVal = 1.0;
                var distFromOpaqueRegion = Math.abs(t-halfNumTraces) - opaqueRegionHalfWidth;
                if (distFromOpaqueRegion>0) {
                    alphaVal = 1.0 - distFromOpaqueRegion/maxTransparentRegionHalfWidth;
                    alphaVal *= 1.0/ctx.lineWidth; //factor that accounts for lineWidth !== 1
                }

                ctx.save();

                ctx.strokeStyle="rgba("+parseInt(255*this._strokeColor[0])+","+parseInt(255*this._strokeColor[1])+","+parseInt(255*this._strokeColor[2])+","+alphaVal+")";
                //linearly interpolate between the two stroke colors
                var currStrokeColor = VecUtils.vecInterpolate(4, this._strokeColor, this._secondStrokeColor, t/numTraces);
                //ctx.strokeStyle="rgba("+parseInt(255*currStrokeColor[0])+","+parseInt(255*currStrokeColor[1])+","+parseInt(255*currStrokeColor[2])+","+alphaVal+")";

                ctx.translate(disp[0],disp[1]);
                ctx.beginPath();
                ctx.moveTo(this._Points[0][0]-bboxMin[0], this._Points[0][1]-bboxMin[1]);
                for (var i=0;i<numPoints;i++){
                    ctx.lineTo(this._Points[i][0]-bboxMin[0], this._Points[i][1]-bboxMin[1]);
                }
                ctx.stroke();
                ctx.restore();
            }
        } else {
            ctx.globalCompositeOperation = 'lighter'; //we wish to add up the colors
            ctx.globalAlpha = this._strokeColor[3];
            ctx.lineCap = "round";
            ctx.lineJoin="round";
            var minStrokeWidth = (this._strokeHardness*this._strokeWidth)/100; //the hardness is the percentage of the stroke width that's fully opaque
            var numlayers = 1 + (this._strokeWidth-minStrokeWidth)/2;
            var alphaVal = 1.0/(numlayers); //this way the alpha at the first path will be 1
            ctx.strokeStyle="rgba("+parseInt(255*this._strokeColor[0])+","+parseInt(255*this._strokeColor[1])+","+parseInt(255*this._strokeColor[2])+","+alphaVal+")";
            for (var l=0;l<numlayers;l++){
                ctx.beginPath();
                ctx.moveTo(this._Points[0][0]-bboxMin[0], this._Points[0][1]-bboxMin[1]);
                if (numPoints===1){
                    //display a tiny segment as a single point
                   ctx.lineTo(this._Points[0][0]-bboxMin[0], this._Points[0][1]-bboxMin[1]+0.01);
                }
                for (var i=1;i<numPoints;i++){
                    ctx.lineTo(this._Points[i][0]-bboxMin[0], this._Points[i][1]-bboxMin[1]);
                }
                ctx.lineWidth=2*l+minStrokeWidth;
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }; //render()


    this.export = function() {
        return "type: " + this.geomType() + "\n";
    };

    this.import = function( importStr ) {

    }

    this.collidesWithPoint = function (x, y, z) {
        if (x < this._BBoxMin[0]) return false;
        if (x > this._BBoxMax[0]) return false;
        if (y < this._BBoxMin[1]) return false;
        if (y > this._BBoxMax[1]) return false;
        if (z < this._BBoxMin[2]) return false;
        if (z > this._BBoxMax[2]) return false;

        return true;
    };

    this.collidesWithPoint = function (x, y) {
        if (x < this._BBoxMin[0]) return false;
        if (x > this._BBoxMax[0]) return false;
        if (y < this._BBoxMin[1]) return false;
        if (y > this._BBoxMax[1]) return false;

        return true;
    };

}; //function BrushStroke ...class definition

BrushStroke.prototype = new GeomObj();

BrushStroke.prototype._CatmullRomSplineInterpolate = function(ctrlPts, t)
{
    //perform CatmullRom interpolation on the spline...assume t is in [0,1]
    var t2 = t*t;
    var t3 = t2*t;
    var retPoint = [0,0,0];
    for (var i=0;i<3;i++){
        retPoint[i] = 0.5 *(
            (2*ctrlPts[1][i]) +
            (-ctrlPts[0][i] + ctrlPts[2][i]) * t +
            (2*ctrlPts[0][i] - 5*ctrlPts[1][i] + 4*ctrlPts[2][i] - ctrlPts[3][i]) * t2 +
            (-ctrlPts[0][i] + 3*ctrlPts[1][i]- 3*ctrlPts[2][i] + ctrlPts[3][i]) * t3);
    }
    return retPoint;
}
if (typeof exports === "object") {
    exports.BrushStroke = BrushStroke;
}
