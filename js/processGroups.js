var svg;
var pathGuate;
var rScale;
var rasterBounds;
var focusWidth;
var w;
var h;
var g;
var violationsGroup;
var zoom;
var zoomed;
//start coords
var a0,
b0, 
a1,
b1;
//end coords
var x0,
y0,
x1,
y1;

var groupNames = [
            "Achi",
            "Akateka",
            "Awakateka",
            "Ch'orti'",
            "Chalchiteka",
            "Chuj",
            "Itza'",
            "Ixil",
            "Jakalteko/Popti'",
            "K'iche'",
            "Kaqchiquel",
            "Mam",
            "Mopan",
            "Poqomam",
            "Poqomchi'",
            "Q'anjob'al",
            "Q'eqchi'",
            "Sakapulteka",
            "Sipakapense",
            "Tektiteka",
            "Tz'utujil",
            "Uspanteka",
            "Maya",
            "Garífuna",
            "Xinka",
            "Afrodescendiente/Creole/Afromestizo",
            "Ladina(o)",
            "Extranjera(o)",
            "total_grupos",
            "Total de personas"
      ];

function loadData(){
    Promise.all([
      d3.json("data/ethnic_groups_municipios.geojson"),
      d3.json("data/municipios_topo.json"),
      d3.json("data/focusArea_extent.geojson"),
      d3.json("data/raster_extent.geojson"),
      d3.json("data/countries_topo.json"),
      d3.json("data/violationsByMunicipio.geojson"),
      d3.json("data/zoomBoxWgs84.geojson")
    ])
    .then(function([groupsJSON,municipiosTOPO,focusAreaJSON,rasterAreaJSON,countriesTOPO,violationsJSON,zoomBoxJSON]){
        var groupsData = groupsJSON.features;
        var municipios = topojson.feature(municipiosTOPO, municipiosTOPO.objects.municipios).features;
        var focusBox = focusAreaJSON;
        var rasterBox = rasterAreaJSON;
        var countries = topojson.feature(countriesTOPO, countriesTOPO.objects.countries).features;
        var violations = violationsJSON;
        var zoomBox = zoomBoxJSON;

        positionMap(municipios,focusBox,rasterBox,countries, zoomBox);
        drawDotDensity(groupsData);
        drawViolations(violations);

    });
}

//creates full screen base map and lines up raster and vector layers
function positionMap(municipios,focusBox,rasterBox,countries, zoomBox){

  console.log("yes!");

    w = $("div.map").width();
    h = $("div.map").height();

    var margin = {top: 5, right: 5, bottom: 5, left: 5}

    //create guatemalaprojection
    const centerLocation = {
      "longitude": -90.2299,
      "latitude": 15.7779
    };
    //albers centered on guatemala
    const albersGuate = d3.geoConicEqualArea()
                      .parallels([14.8,16.8]) 
                      .rotate([centerLocation["longitude"]*-1,0,0])
                      .center([0,centerLocation["latitude"]])
                      .fitExtent([[margin.left,margin.top],[w-margin.right,h-margin.bottom]], focusBox);

    //path generator
    pathGuate = d3.geoPath()
             .projection(albersGuate);

    //store width of focus area to scale vectors
    var computedBox = pathGuate.bounds(focusBox);
    focusWidth = computedBox[1][0] - computedBox[0][0];

    var container = d3.select("div.map");

    [[a0, b0], [a1, b1]] = [[0,0],[w,h]];

    svg = container.append("svg")
              .attr("class", "magic")
              .attr("viewBox", `0 0 ${w} ${h}`)
              .attr("overflow", "visible")
              .style("position","relative")
              .style("z-index", 1)

    g = svg.append("g");

    //calculate raster extent
    rasterBounds = pathGuate.bounds(rasterBox);
    var rasterWidth = rasterBounds[1][0] - rasterBounds[0][0];
    var rasterOrigin = [rasterBounds[0][0],rasterBounds[0][1]];


    //append raster background
    g.append("g")
          .attr("class", "raster")
        .append("image")
            .attr("href", "img/6000hs.jpg")
            .attr("x", rasterOrigin[0])
            .attr("y", rasterOrigin[1])
            .attr("width", rasterWidth)          
            .attr("transform", "translate(0,5)");



    //draw countries
    var countryBorders = g.append("g")
                            .selectAll(".country")
                            .data(countries)
                            .enter()
                            .append("path")
                                .attr("d", pathGuate)
                                .attr("class", "country");

    // add zoom
    zoom = d3.zoom()
          .scaleExtent([1, 8])
          .on("zoom", zoomed);


    zoomed = function() {
        g.attr("transform", d3.event.transform);
        g.attr("stroke-width", 1 / d3.event.transform.k);
      }

    var zoomBounds = pathGuate.bounds(zoomBox);
    [[x0, y0], [x1, y1]] = zoomBounds;


    // function zoomMap(){
    //   var [[x0, y0], [x1, y1]] = pathGuate.bounds(zoomBox);
    //   svg.transition("zoom in!").duration(1000).attr("viewBox", `${x0} ${y0} ${x1} ${y1}`);
    // }

    // function zoomMap(){
    //     var [[x0, y0], [x1, y1]] = pathGuate.bounds(zoomBox);


    //     svg.transition().duration(1000).call(
    //       zoom.transform,
    //       d3.zoomIdentity
    //         .translate(w/2,h/2)
    //         .scale(Math.min(8, 1 / Math.max((x1 - x0) / w, (y1 - y0) / h)))
    //         .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
    //       )
    // }


    // //draw labels as HTML so it doesn't scale with viewbox
    // var countriesLabels = d3.select("div.map").append("div").attr("class", "labels")
    //                             .selectAll(".country")
    //                             .data(countries)
    //                             .enter()
    //                             .append("p")
    //                             .text(d=>d.properties["NAME"])
    //                                 .style("left", function(d){
    //                                     return pathGuate.centroid(d)[0]/w*100+"%";
    //                                 })
    //                                 .style("top", function(d){
    //                                     return pathGuate.centroid(d)[1]/h*100+"%";
    //                                 });

    // console.log(countriesLabels);



}


function drawDotDensity(groupsData){

    //draw municipios
    var municipios = g.append("g")
                            .selectAll(".municipio")
                            .data(groupsData)
                            .enter()
                            .append("path")
                                .attr("d", pathGuate)
                                .attr("class", "municipio");

    // var municipioLabels = g.append("g")
    //                         .selectAll(".label")
    //                         .data(groupsData)
    //                         .enter()
    //                         .append("text")
    //                             .text(d=>d.properties["Municipio"])
    //                                 .attr("x", function(d){
    //                                     return pathGuate.centroid(d)[0]/w*100+"%";
    //                                 })
    //                                 .attr("y", function(d){
    //                                     return pathGuate.centroid(d)[1]/h*100+"%";
    //                                 })
    //                             .attr("font-size", "3px")
    //                             .attr("text-anchor", "middle");

    // //draw labels as HTML so it doesn't scale with viewbox
    // var countriesLabels = d3.select("div.map").append("div").attr("class", "labels")
    //                             .selectAll(".country")
    //                             .data(countries)
    //                             .enter()
    //                             .append("p")
    //                             .text(d=>d.properties["NAME"])
    //                                 .style("left", function(d){
    //                                     return pathGuate.centroid(d)[0]/w*100+"%";
    //                                 })
    //                                 .style("top", function(d){
    //                                     return pathGuate.centroid(d)[1]/h*100+"%";
    //                                 });
}

function drawViolations(violations){

    rScale = d3.scaleSqrt()
                  .domain([0,5000])
                  .range([0, focusWidth/18]);

    var filtered = violations.features.filter(function(feature){
        if(feature.properties["violations"]) return feature;
    });

    var violationsPacked = makeSiblingPack(filtered,"violations","c_tot");
    var violationsSpread =  applySimulation(violationsPacked);

    console.log(violationsSpread);

    //add spread bubbles
    violationsGroup = g.append("g").attr("class", "violations").attr("opacity", 1);
    
    var circleGroups =  violationsGroup.selectAll(".circleGroups")
                               .data(violationsSpread)
                               .enter()
                               .append("g")
                               .attr("transform", d => `translate(${d.x} ${d.y})`);

     // var outerCircles = circleGroups.append("circle")
     //           .attr("class", "outerCircle")
     //           .attr("r", d => d.properties["violations_mama"].r)
     //           .attr("fill", "none")
     //           .attr("stroke", "#fff")
     //           .attr("stroke-width", 0.1);

     circleGroups.each(function(d){  
           for(i=0;i<d.properties["violations_siblings"].length;i++){
               d3.select(this).append("circle")
                                 .attr("class", "innerCircle")
                                   .attr("cx", d=>d.properties["violations_siblings"][i].x)
                                   .attr("cy", d=>d.properties["violations_siblings"][i].y)
                                   .attr("r", d=>d.properties["violations_siblings"][i].r-0.1)
                                   .datum([d.properties["violations"][i]])
                                   .attr("fill", "#fff")
                                   .on("click", function(d){
                                      console.log(d);
                                   });
           }
     });


}

function makeSiblingPack(features,attribute,radiusAttribute){
  
  for(var feature of features){

    if(feature.properties[attribute]){

      feature.properties[attribute+"_siblings"] = [];

      for(var i=0; i < feature.properties[attribute].length; i++){
          var violation = feature.properties[attribute][i];
          //filter
          if(violation["n_year"] < 1985){
              feature.properties[attribute+"_siblings"].push({
                "uniqueId": i,
                "r": rScale(violation["c_tot"])
              });
          }
      }

     feature.properties[attribute+"_siblings"] = d3.packSiblings(feature.properties[attribute+"_siblings"]);
     feature.properties[attribute+"_mama"] = d3.packEnclose(feature.properties[attribute+"_siblings"]);
    } 
  }

  var nonZero = features.filter(function(feature){
    if(feature.properties[attribute+"_siblings"].length>0) return feature;
  });

  return nonZero;
}

function applySimulation(nodes){
    var nodePadding = 0.05;
    const simulation = d3.forceSimulation(nodes)
    // .force("cx", d3.forceX().x(d => w / 2).strength(0.005))
    // .force("cy", d3.forceY().y(d => h / 2).strength(0.005))
    .force("x", d3.forceX().x(d => pathGuate.centroid(d) ? pathGuate.centroid(d)[0] : 0).strength(1))
    .force("y", d3.forceY().y(d => pathGuate.centroid(d) ? pathGuate.centroid(d)[1] : 0).strength(1))
    // .force("charge", d3.forceManyBody().strength(-1))
    .force("collide", d3.forceCollide().radius(d => d.properties["violations_mama"].r  + nodePadding).strength(1))
    .stop();

    let i = 0; 
    while (simulation.alpha() > 0.01 && i < 200) {
      simulation.tick(); 
      i++;
    }

    return simulation.nodes();
}

//////////////////////////////////////////////////////////////////////
//////////////////1)Smooth Animations, with RAF///////////////////////////////
//////////////////////////////////////////////////////////////////////

//observer for 1000
var observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: [0,0.1]
}

let observer = new IntersectionObserver(intersectionCallback, observerOptions);

var target = d3.select(".zoomer").node();
observer.observe(target);

var latestKnownTop = window.innerHeight;
var ticking = false;

function onScroll(){
  latestKnownTop = target.getBoundingClientRect().top;
  requestTick();
}

function requestTick(){
  if(!ticking){
      requestAnimationFrame(update);
  }
  ticking = true;
}

function update(){
  
  console.log("updating!");
  //reset tick to capture next scroll
  ticking = false;
  

  var currentTop = latestKnownTop;

  var percent = (window.innerHeight - currentTop)/ window.innerHeight;
  
  if(percent>1) percent = 1;
  if(percent<0) percent = 0;

  
  var [[tx0,ty0],[tx1,ty1]] = [[a0 + (x0-a0)*percent, b0 + (y0-b0)*percent],[a1 + (x1-a1)*percent, b1 + (y1-b1)*percent] ];

  svg.attr("viewBox", `${tx0} ${ty0} ${tx1} ${ty1}`);



  // console.log("zoom!")
  // console.log(zoom);

  // svg.transition("zoom").duration(500).call(
  //     zoom.transform,
  //     d3.zoomIdentity
  //       .translate(w/2,h/2)
  //       .scale(Math.min(8, 1 / Math.max((tx1 - tx0) / w, (ty1 - ty0) / h)))
  //       .translate(-(tx0 + tx1) / 2, -(ty0 + ty1) / 2)
  //     )




}
var listening;

function intersectionCallback(entries, observer){
  if(entries[0].intersectionRatio>0){
    if(!listening) {
      window.addEventListener("scroll",onScroll);
      console.log("add listener!");
    }
    listening = true;
  } else {
    console.log("remove listener!");
    window.removeEventListener("scroll", onScroll);
    listening = false;
  }
}




loadData();


// function clicked(d) {

//     const [[x0, y0], [x1, y1]] = path.bounds(d);
//     d3.event.stopPropagation();
//     svg.transition().duration(durationMs).call(
//       zoom.transform,
//       d3.zoomIdentity
//         .translate(w / 2, h / 2)
//         .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
//         .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
//       d3.mouse(svg.node())
//     );
//     // show counties when zoomed in on a state
//     countyFills.transition().duration(durationMs)
//       .attr("opacity", 1.0);
//   }