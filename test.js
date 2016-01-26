isDebug = true;
function log(string)
{
    if (isDebug)
        console.log(string);
}

Vector3 = function (x, y, z){
    this.x = x;
    this.y = y;
    this.z = z; 
}

Vector3.prototype = {
    dot: function(v){
        return this.x * v.x + this.y * v.y + this.z * v.z;
    },

    cross: function(v)
    {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
            );
    },

    add: function (v) {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    },

    minus: function (v)
    {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    },

    normalized: function (){
        if (this.isEqual(Vector3.zero))
        {
            //zero vector cannot be normalized.
            return this;
        }
        var len_1 = 1 / this.magnitude();
        return new Vector3(this.x * len_1, this.y * len_1, this.z * len_1);
    },

    magnitude: function ()
    {
        return Math.sqrt(this.sqrMagnitude());
    },

    sqrMagnitude: function ()
    {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },

    negate: function()
    {
        return new Vector3(-this.x, -this.y, -this.z);
    },

    multiply: function (f) {
        return new Vector3(this.x * f, this.y * f, this.z * f);
    },

    isEqual: function (v){
        return this.x == v.x &&
                this.y == v.y &&
                this.z == v.z;
    },

    toString: function()
    {
        return "(" + this.x + ", " + this.y + ", " + this.z + ")";
    }
};

Vector3.zero = new Vector3(0, 0, 0);
Vector3.up = new Vector3(0, 1, 0);
Vector3.forward = new Vector3(0, 0, 1);
Vector3.right = new Vector3(1, 0, 0);
Vector3.one = new Vector3(1, 1, 1);

Ray3 = function(origin, direction)
{
    this.origin = origin;
    this.direction = direction;
}

Ray3.prototype = {

    getPoint: function(len){
        return this.origin.add(this.direction.multiply(len));
    }

};


IntersectResult = function()
{
    this.geometry = null;
    this.distance = 0;
    this.position = Vector3.zero;
    this.normal = Vector3.zero;
}

IntersectResult.prototype = {
    isHit: function()
    {
        return this.geometry != null;
    }
}

IntersectResult.noHit = new IntersectResult();

ProjectionCamera = function (position, upDir, lookDir, fov)
{
    this.position = position;
    this.upDir = upDir;
    this.lookDir = lookDir;
    this.fov = fov;
    
}

ProjectionCamera.prototype = {

    init: function()
    {
        this.rightDir = this.lookDir.cross(this.upDir);
        this.fovScale = Math.tan(this.fov * 0.5 * Math.PI / 180) * 2;

        log("rightDir:" + this.rightDir.toString());
    },

    generateRay: function(x, y)
    {
        var r = this.rightDir.multiply((x - 0.5) * this.fovScale);
        var u = this.upDir.multiply((y - 0.5) * this.fovScale);
        return new Ray3(this.position, this.lookDir.add(r).add(u).normalized());
    },

    objectsToRender: new Array(),
    
    addRenderObject: function(obj)
    {
        this.objectsToRender.push(obj);
    },

    takePhoto: function (pixels, width, height, maxDepth)
    {

        var viewPortX = 0;
        var viewPortY = 0;
        var i = 0;
        var objsLen = this.objectsToRender.length;
        log("objs len:" + objsLen);

        var rec = {
            maxRightPos: Vector3.zero,
            normal: Vector3.zero
        };

        //for debug
        var logInterval = 0;

        for (var y = 0; y < height; y++)
        {
            viewPortY = 1 - (y / height);
            for (var x = 0; x < width; x++)
            {
                if (logInterval >= 100)
                {
                    logInterval = 0;
                }

                viewPortX = x / width;
                
                // if (viewPortX + viewPortY > 1)
                // {
                //     pixels[i    ] = viewPortX * 255;
                //     pixels[i + 1] = viewPortY * 255;
                //     pixels[i + 2] = 0;
                //     pixels[i + 3] = 255;
                // }
                
                var ray = this.generateRay(viewPortX, viewPortY);
                var result = IntersectResult.noHit;

                // if (logInterval == 0){
                //     log("viewPort:" + viewPortX + "," + viewPortY);
                //     log("result:" + result.isHit() + ", ray:" + ray.origin.toString() + ", direction" + ray.direction.toString());
                // }

                for (var oIndex = 0; oIndex < this.objectsToRender.length; oIndex++)
                {
                    var obj = this.objectsToRender[oIndex];
                    var thisResult = obj.intersect(ray);

                    if (thisResult.isHit())
                    {
                        if (!result.isHit() || result.distance > thisResult.distance)
                        {
                            result = thisResult;
                        }
                    }

                }

                if (result.isHit())
                {
                    //render this point
                    
                    // var c = (1 - result.distance / maxDepth) * 255;
                    // var c = 255 - Math.min((result.distance / maxDepth) * 255, 255);
                    // pixels[i    ] = c;
                    // pixels[i + 1] = c;
                    // pixels[i + 2] = c;
                    
                    // pixels[i    ] = (result.normal.x + 1) * 128;
                    // pixels[i + 1] = (result.normal.y + 1) * 128;
                    // pixels[i + 2] = (result.normal.z + 1) * 128;


                    if (rec.maxRightPos.x < result.position.x)
                    {
                        rec.maxRightPos = result.position;
                        rec.normal = result.normal;
                    }

                    var color = result.geometry.material.sample2(ray, result.position, result.normal);
                    pixels[i    ] = color.r * 255;
                    pixels[i + 1] = color.g * 255;
                    pixels[i + 2] = color.b * 255;

                    pixels[i + 3] = 255;
                }
                
                i += 4;
                logInterval++;
            }
        }

        log("maxRightPos:" + rec.maxRightPos.toString() + " normal:" + rec.normal.toString());
    },

};


//Color
Color = function(r, g, b) { this.r = r; this.g = g; this.b = b };
 
Color.prototype = {
    copy : function() { return new Color(this.r, this.g, this.b); },
    add : function(c) { return new Color(this.r + c.r, this.g + c.g, this.b + c.b); },
    multiply : function(s) { return new Color(this.r * s, this.g * s, this.b * s); },
    modulate : function(c) { return new Color(this.r * c.r, this.g * c.g, this.b * c.b); }
};

Color.black = new Color(0, 0, 0);
Color.white = new Color(1, 1, 1);
Color.red = new Color(1, 0, 0);
Color.green = new Color(0, 1, 0);
Color.blue = new Color(0, 0, 1);
Color.yellow = new Color(1, 1, 0);


PhongMaterial = function(diffuse, specular, shininess, reflectiveness) {
    this.diffuse = diffuse;
    this.specular = specular;
    this.shininess = shininess;
    this.reflectiveness = reflectiveness;
};

// global temp
var lightDir = new Vector3(1, 1, 1).negate().normalized();
var lightColor = Color.white;

PhongMaterial.prototype = {
    sample: function(ray, position, normal) {
        var l = lightDir;//.negate();

        var NdotL = normal.dot(l);
        var H = (l.minus(ray.direction)).normalized();//.negate();
        var NdotH = normal.dot(H);
        var diffuseTerm = this.diffuse.multiply(Math.max(NdotL, 0));
        var specularTerm = this.specular.multiply(Math.pow(Math.max(NdotH, 0), this.shininess));
        return lightColor.modulate(diffuseTerm.add(specularTerm));

    },
    sample2: function(ray, position, normal) {
        var NdotL = normal.dot(lightDir.negate());
        var H = (lightDir.negate().minus(ray.direction)).normalized();
        var NdotH = normal.dot(H);
        var diffuseFactor = this.diffuse.multiply(Math.max(NdotL, 0));
        var specularFactor = this.specular.multiply(Math.pow(Math.max(NdotH, 0), this.shininess));
        return lightColor.modulate(diffuseFactor.add(specularFactor));
    }
};

$(document).ready(function(){

    var canvas = document.getElementById("my_canvas");

    var ctx = canvas.getContext("2d");

    var w = canvas.attributes.width.value;
    var h = canvas.attributes.height.value;

    ctx.fillStyle = "rgb(0,0,0)";
    ctx.fillRect(0, 0, w, h);

    var imgdata = ctx.getImageData(0, 0, w, h);
    var pixels = imgdata.data;

    var camera = new ProjectionCamera(new Vector3(0, 5, 15), Vector3.up, new Vector3(0, 0, -1), 90);
    var sphere = new Sphere(new Vector3(-10, 10, -10), 5);
    sphere.material = new PhongMaterial(Color.red, Color.white, 16);
    
    camera.init();
    camera.addRenderObject(sphere);
    // camera.addRenderObject(sphere2);
    camera.takePhoto(pixels, w, h, 20);
    
    ctx.putImageData(imgdata, 0, 0);
    

    //debug
    // var sphere3 = new Sphere(new Vector3(0, 25, 0), 5);
    // var ray = camera.generateRay(0.5, 1);

    // var result = sphere3.intersect(ray);
    // var pos = result.position;
    // log("intersect pos:" + pos.toString());


    // var sphere4 = new Sphere(new Vector3(25, 0, 0), 5);
    // var ray2 = camera.generateRay(1, 0.5);
    // var result2 = sphere4.intersect(ray2);
    // log("intersect pos2:" + result2.position.toString());
    // log("intersect normal2:" + result2.normal.toString());

    // var sphere5 = new Sphere(Vector3.zero, 10);
    // var ray5 = camera.generateRay(0.5, 0.5);
    // var result5 = sphere5.intersect(ray5);
    // log("intersect normal5:" + result5.normal.toString());

    // var ray = new Ray3(camera.position, Vector3.forward);
    // var result = sphere.intersect(ray);
    // log("hit:" + result.isHit() ? "true" : "false");


    // var plane = new Plane(new Vector3(0, 1, 0), 0);
    // var sphere1 = new Sphere(new Vector3(-10, 10, -10), 10);
    // var sphere2 = new Sphere(new Vector3(10, 10, -10), 10);
    // plane.material = new CheckerMaterial(0.1, 0.5);
    // sphere1.material = new PhongMaterial(Color.red, Color.white, 16, 0.25);
    // sphere2.material = new PhongMaterial(Color.blue, Color.white, 16, 0.25);
    // rayTraceReflection(
    //     canvas,
    //     new Union([plane, sphere1, sphere2]),
    //     new PerspectiveCamera(new Vector3(0, 5, 15), new Vector3(0, 0, -1), new Vector3(0, 1, 0), 90),
    //     3);

});