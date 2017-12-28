let customBase = document.createElement('custom');
let custom = d3.select(customBase);
// This is your SVG replacement and the parent of all other elements

// Settings for a grid with 10 cells in a row,
// 100 cells in a block and 1000 cells in a row.
let groupSpacing = 4;
let cellSpacing = 2;
let offsetTop = height / 5;
let cellSize = Math.floor((width - 11 * groupSpacing) / 100) - cellSpacing;

databind = data => {
  // Get a scale for the colours - not essential but nice.
  colourScale = d3.scaleSequential(d3.interpolateSpectral).domain(
    d3.extent(data, function(d) {
      return d;
    })
  );

  let join = custom.selectAll('custom.rect').data(data);

  let enterSel = join
    .enter()
    .append('custom')
    .attr('class', 'rect')
    .attr('x', function(d, i) {
      let x0 = Math.floor(i / 100) % 10,
        x1 = Math.floor(i % 10);
      return groupSpacing * x0 + (cellSpacing + cellSize) * (x1 + x0 * 10);
    })
    .attr('y', function(d, i) {
      let y0 = Math.floor(i / 1000),
        y1 = Math.floor((i % 100) / 10);
      return groupSpacing * y0 + (cellSpacing + cellSize) * (y1 + y0 * 10);
    })
    .attr('width', 0)
    .attr('height', 0);

  join
    .merge(enterSel)
    .transition()
    .attr('width', cellSize)
    .attr('height', cellSize)
    .attr('fillStyle', function(d) {
      return colourScale(d);
    });

  let exitSel = join
    .exit()
    .transition()
    .attr('width', 0)
    .attr('height', 0)
    .remove();
};

draw = () => {
  // Draw the elements on the canvas.
};
