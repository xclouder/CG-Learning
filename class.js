Sphere = function(center, radius)
{
    this.center = center;
    this.radius = radius;
    this.sqrRadius = radius * radius;
}

Sphere.prototype = {
    intersect: function(ray)
    {
        var v = ray.origin.minus(this.center);
        var a0 = v.sqrMagnitude() - this.sqrRadius;
        var DdotV = ray.direction.dot(v);
 
        if (DdotV <= 0) {
            var discr = DdotV * DdotV - a0;
            if (discr >= 0) {
                var result = new IntersectResult();
                result.geometry = this;
                result.distance = -DdotV - Math.sqrt(discr);
                result.position = ray.getPoint(result.distance);
                result.normal = result.position.minus(this.center).normalized();
                return result;
            }
        }
 
        return IntersectResult.noHit;   
    }

}