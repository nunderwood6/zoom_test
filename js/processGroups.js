var svg;
var pathGuate;
var rScale;
var rasterBounds;
var focusWidth;
var w;
var h;
var g;
var violationsGroup;


// add zoom
const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed);


function zoomed() {
    g.attr("transform", d3.event.transform);
    g.attr("stroke-width", 1 / d3.event.transform.k);
  }

//1st end coords
var x1,
y1,
w1,
h1;
//2nd end coords
var x2,
y2,
w2,
h2;

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
      d3.json("data/zoomBoxWgs84.geojson"),
      d3.json("data/secondZoom.geojson")
    ])
    .then(function([groupsJSON,municipiosTOPO,focusAreaJSON,rasterAreaJSON,countriesTOPO,violationsJSON,zoomBoxJSON,secondZoomJSON]){
        var groupsData = groupsJSON.features;
        var municipios = topojson.feature(municipiosTOPO, municipiosTOPO.objects.municipios).features;
        var focusBox = focusAreaJSON;
        var rasterBox = rasterAreaJSON;
        var countries = topojson.feature(countriesTOPO, countriesTOPO.objects.countries).features;
        var violations = violationsJSON;
        var zoomBox = zoomBoxJSON;
        var secondZoom = secondZoomJSON;

        positionMap(municipios,focusBox,rasterBox,countries, zoomBox,secondZoom);
        // drawDotDensity(groupsData);
        // drawViolations(violations);

    });
}

//creates full screen base map and lines up raster and vector layers
function positionMap(municipios,focusBox,rasterBox,countries, zoomBox, secondZoom){

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


    var zoomBounds = pathGuate.bounds(zoomBox);
    console.log(zoomBounds);
    [x1, y1] = zoomBounds[0];
    w1 = zoomBounds[1][0] - zoomBounds[0][0];
    h1 = zoomBounds[1][1] - zoomBounds [0][1]

    var secondZoomBounds = pathGuate.bounds(secondZoom);
    [x2, y2] = secondZoomBounds[0];
    w2 = secondZoomBounds[1][0] - secondZoomBounds[0][0];
    h2 = secondZoomBounds[1][1] - secondZoomBounds [0][1]


    // setTimeout(function(){
    //   zoomMap();
    // },10000);

    // // console.log

    // function zoomMap(){
    //     console.log("hi");
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

//observer for first zoom
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
var accelAmmount = 0.9;

function update(){
    //reset tick to capture next scroll
  ticking = false;
  
  var currentTop = latestKnownTop;
  var percent = (window.innerHeight - currentTop)/ window.innerHeight;

  if(percent>1) percent = 1;
  if(percent<0) percent = 0;

  // var [[tx,ty],[tw,th]] = [[x1*percent, y1*percent],[w + (w1-w)*percent, h + (h1-h)*percent]];
  var targetScale = 3;
  var s = 1 + (targetScale-1)*percent;



  g.transition().duration(0).attr("transform", `scale(${s} ${s})`);
  // svg.transition().duration(0).attr("viewBox", `${tx} ${ty} ${tw} ${th}`);
  // console.log("fire!");

}


var listening;

function intersectionCallback(entries, observer){
  if(entries[0].intersectionRatio>0){
    if(!listening) {
      window.addEventListener("scroll",onScroll);
    }
    listening = true;
  } else {
    window.removeEventListener("scroll", onScroll);
    listening = false;
  }
}


////////////////////////////////////

//observer for first zoom
var observerOptions2 = {
  root: null,
  rootMargin: "0px",
  threshold: [0,0.1]
}

let observer2 = new IntersectionObserver(intersectionCallback2, observerOptions2);

var target2 = d3.select(".zoomer2").node();
observer2.observe(target2);

var latestKnownTop = window.innerHeight;
var ticking2 = false;

function onScroll2(){
  latestKnownTop = target2.getBoundingClientRect().top;
  requestTick2();
}

function requestTick2(){
  if(!ticking2){
      requestAnimationFrame(update2);
  }
  ticking2 = true;
}

function update2(){
  //reset tick to capture next scroll
  ticking2 = false;
  
  var currentTop = latestKnownTop;
  var percent = (window.innerHeight - currentTop)/ window.innerHeight;
  if(percent>1) percent = 1;
  if(percent<0) percent = 0;


  g.transition().duration(0).attr("transform", `scale(3 3) translate(${percent*-200} ${percent*-500})`);

  // var [[tx,ty],[tw,th]] = [[x1 + (x2-x1)*percent, y1 + (y2-y1)*percent],[w1 + (w2-w1)*percent, h1 + (h2-h1)*percent] ];
  // svg.attr("viewBox", `${tx} ${ty} ${tw} ${th}`);

}


var listening2;

function intersectionCallback2(entries, observer){
  if(entries[0].intersectionRatio>0){
    if(!listening2) {
      window.addEventListener("scroll",onScroll2);
    }
    listening2 = true;
  } else {
    window.removeEventListener("scroll", onScroll2);
    listening2 = false;
  }
}



loadData();


