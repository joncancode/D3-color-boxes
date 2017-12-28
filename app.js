let log = console.log.bind(console);
let dir = console.dir.bind(console);
let replace = function(string) { return string.replace(/[^a-z0-9]/gi,""); };


// === Set up canvas === //

let width = 750,
    height = 400;

let data = [];
let value = 5000;
let colorScale;


let mainCanvas = d3.select('#container')
  .append('canvas')
  .classed('mainCanvas', true)
  .attr('width', width)
  .attr('height', height);

let hiddenCanvas = d3.select('#container')
  .append('canvas')
  .classed('hiddenCanvas', true)
  .attr('width', width)
  .attr('height', height);

let colourToNode = {}; // map to track the colour of nodes

// function to create new colours for the picking

let nextCol = 1;

function genColor(){
  let ret = [];
  // via http://stackoverflow.com/a/15804183
  if(nextCol < 16777215){
    ret.push(nextCol & 0xff); // R
    ret.push((nextCol & 0xff00) >> 8); // G 
    ret.push((nextCol & 0xff0000) >> 16); // B

    nextCol += 1; 
  }
  let col = "rgb(" + ret.join(',') + ")";
  return col;
}


// === Load and prepare the data === //

d3.range(value).forEach(function(el) {
  
  data.push({ value: el });

});


// === Bind data to custom elements === //

let customBase = document.createElement('custom');
let custom = d3.select(customBase); // this is our svg replacement


// settings for a grid with 40 cells in a row and 2x5 cells in a group
let groupSpacing = 4;
let cellSpacing = 2;
let cellSize = Math.floor((width - 11 * groupSpacing) / 100) - cellSpacing;


// === First call === //

databind(data); // ...then update the databind function

let t = d3.timer(function(elapsed) {
  draw(mainCanvas, false); // <--- new insert arguments
  if (elapsed > 300) t.stop();
}); // start a timer that runs the draw function for 300 ms (this needs to be higher than the transition in the databind function)


// === Bind and draw functions === //

function databind(data) {

  colorScale = d3.scaleSequential(d3.interpolateSpectral).domain(d3.extent(data, function(d) { return d.value; }));
  
  let join = custom.selectAll('custom.rect')
    .data(data);

  let enterSel = join.enter()
    .append('custom')
    .attr('class', 'rect')
    .attr('x', function(d, i) {
      let x0 = Math.floor(i / 100) % 10, x1 = Math.floor(i % 10);
      return groupSpacing * x0 + (cellSpacing + cellSize) * (x1 + x0 * 10);
    })
    .attr('y', function(d, i) {
      let y0 = Math.floor(i / 1000), y1 = Math.floor(i % 100 / 10);
      return groupSpacing * y0 + (cellSpacing + cellSize) * (y1 + y0 * 10);
    })
    .attr('width', 0)
    .attr('height', 0);

  join
    .merge(enterSel)
    .transition()
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('fillStyle', function(d) { return colorScale(d.value); })

    .attr('fillStyleHidden', function(d) { 
      if (!d.hiddenCol) {

        d.hiddenCol = genColor();
        colourToNode[d.hiddenCol] = d;

      } // here we (1) add a unique colour as property to each element and (2) map the colour to the node in the colourToNode-dictionary 
      
      return d.hiddenCol;

    });


  let exitSel = join.exit()
    .transition()
    .attr('width', 0)
    .attr('height', 0)
    .remove();

} // databind()


// === Draw canvas === //

function draw(canvas, hidden) { // <---- new arguments

  // build context
  let context = canvas.node().getContext('2d');


  // clear canvas
  context.clearRect(0, 0, width, height);

  
  // draw each individual custom element with their properties
  
  let elements = custom.selectAll('custom.rect') // this is the same as the join variable, but used here to draw
  
  elements.each(function(d,i) { // for each virtual/custom element...

    let node = d3.select(this);

    context.fillStyle = hidden ? node.attr('fillStyleHidden') : node.attr('fillStyle'); // <--- new: node colour depends on the canvas we draw 
    context.fillRect(node.attr('x'), node.attr('y'), node.attr('width'), node.attr('height'))

  });

} // draw()


// === Listeners/handlers === //


d3.select('#text-input').on('keydown', function() {

  if (d3.event.keyCode === 13) {

    d3.select('#alert').html('');

    if (+this.value < 1 || +this.value > 10000) {

      d3.select('#text-explain').classed('alert', true);

      return;

    } else {

      d3.select('#text-explain').classed('alert', false);

      data = [];	
      
      d3.range(+this.value).forEach(function(el) {
        
        data.push({ value: el });
      
      });
      
      databind(data);

      let t = d3.timer(function(elapsed) {
        draw(mainCanvas, false); // <--- new insert arguments
        if (elapsed > 300) t.stop();
      }); // start a timer that runs the draw function for 300 ms (this needs to be higher than the transition in the databind function)

    } // value test
  
  } // keyCode 13 === return
  
}); // text input listener/handler




// new -----------------------------------------------------



d3.select('.mainCanvas').on('mousemove', function() {

  // draw the hiddenCanvas
  draw(hiddenCanvas, true); 

  // get mousePositions from the main canvas
  let mouseX = d3.event.layerX || d3.event.offsetX;
  let mouseY = d3.event.layerY || d3.event.offsetY;
  

  // get the toolbox for the hidden canvas  
  let hiddenCtx = hiddenCanvas.node().getContext('2d');

  // Now to pick the colours from where our mouse is then stringify it in a way our map-object can read it
  let col = hiddenCtx.getImageData(mouseX, mouseY, 1, 1).data;
  let colKey = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
  
  // get the data from our map !
  let nodeData = colourToNode[colKey];
  
  log(nodeData);


  if (nodeData) {

    // Show the tooltip only when there is nodeData found by the mouse

    d3.select('#tooltip')
      .style('opacity', 0.8)
      .style('top', d3.event.pageY + 5 + 'px')
      .style('left', d3.event.pageX + 5 + 'px')
      .html(nodeData.value);

  } else {

    // Hide the tooltip when there our mouse doesn't find nodeData

    d3.select('#tooltip')
      .style('opacity', 0);

  }

}); // canvas listener/handler 


