import { intersection } from 'polygon-clipping';

type Point = [number, number];
type Poly = Array<Point>;
type Layer = Array<Poly>;

const doResize = true;
const padding = .2;
const gutter = .2;
const numTriangles = 3;
const backgroundFill = "#FFCC00";
const foregroundFill = "#CCFF00";
const intersectionFill = "#00CCFF";

function resizeCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    let minDimension = Math.min(window.innerWidth, window.innerHeight);
    if (!doResize) {
        minDimension = canvas.width;
    }
    canvas.width = minDimension;
    canvas.height = minDimension;
    // i don't know why i chose to do scale this way
    ctx.setTransform(minDimension, 0, 0, minDimension, 0, 0);
}


function genTriangles(translate: Point, numTriangles: number, padding: number, gutter: number): Array<Poly> {
    let drawArea = 1 - 2 * gutter;
    let sideLength = drawArea / (numTriangles * (padding + 1));
    let padded = padding * sideLength;
    let translateScale = 2 * gutter;
    let yLength = sideLength * (3 ** .5) / 2;
    let yGutter = (1 - (yLength + sideLength * padding) * 3) / 2

    let polys = new Array(numTriangles * numTriangles);
    for (let i = 0; i < numTriangles; i++) {
        for (let j = 0; j < numTriangles; j++) {
            let offsetX = gutter + translate[0] * translateScale + i * (padded + sideLength);
            let offsetY = yGutter + translate[1] * translateScale + j * (padded + yLength);
            polys[i*numTriangles + j] = [
                [offsetX, offsetY + yLength],
                [offsetX + sideLength / 2, offsetY],
                [offsetX + sideLength, offsetY + yLength]  
            ];
        }
    }
    return polys;
}

function genIntersections(poly: Poly, polys: Array<Poly>): Array<Poly> {
    return intersection([poly], polys.map(x => [x])).map(x => x[0]);
}


function drawPoly(ctx: CanvasRenderingContext2D, poly: Poly) {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (var p of poly.slice(1)) {
        ctx.lineTo(p[0], p[1]);
    }
    ctx.fill();
    ctx.stroke();
    ctx.closePath();
}

function createLayers(ctx: CanvasRenderingContext2D) {
    var a: Poly = [[101.732, 231.500], [143.500, 124.376], [185.268, 231.500], [101.732, 231.500]];
    var b: Poly = [[112.728, 270.500], [175.500, 107.392], [238.272, 270.500], [112.728, 270.500]];
    var c: Poly = [[130.728, 309.500], [214.500, 91.394], [298.272, 309.500], [130.728, 309.500]];
    return [[a], [b], [c]];

    // drawPoly(ctx, a, backgroundFill);
    // drawPoly(ctx, b, foregroundFill);
    // drawPoly(ctx, c, intersectionFill);
}

function translateLayer(p: Array<Poly>, t: Point): Array<Poly> {
    return p.map(x => x.map(y => [y[0] + t[0], y[1] + t[1]]));
}

function intersectLayers(l1: Layer, l2: Layer): Array<Poly> {
    let intersections = l1.map(x => genIntersections(x, l2)).reduce((p, cur) => p.concat(cur));
    return intersections;
}

function drawLayers(ctx: CanvasRenderingContext2D, ls: Array<Layer>) {
    for (let l of ls) {
        for (let p of l) {
            drawPoly(ctx, p);
        }
    }
}


function draw (ctx: CanvasRenderingContext2D, translate: Point) {
    let canvas = ctx.canvas;
    let x = translate[0];
    let y = translate[1];
    var layers = createLayers(ctx);
    var count = 0;
    
    layers = layers.map(l => {
        count +=1;
        return translateLayer(l, [x * count * .2, y * count * .2]);
    });

    let intersections: Array<Poly> = [];

    for (let i = 0; i < layers.length; i++) {
        for (let j = i+1; j < layers.length; j++) {
            intersections = intersections.concat(intersectLayers(layers[i], layers[j]));
        }
    }

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawLayers(ctx, layers);
    ctx.fillStyle = "#C1512A";
    ctx.strokeStyle = "#C1512A";
    drawLayers(ctx, [intersections]);
}

function main() {
    let canvas = <HTMLCanvasElement>document.querySelectorAll('canvas')[0];
    let ctx = canvas.getContext('2d');

    // resizeCanvas(canvas, ctx);
    draw(ctx, [0,0]);

    let translateX = 0;
    let translateY = 0;

    window.addEventListener('mousemove', function (e) {
        var center = [];

        translateX = -(e.clientX - window.innerWidth / 2 );
        translateY = -(e.clientY - window.innerHeight / 2);

        requestAnimationFrame(()=> {
            draw(ctx, [translateX, translateY]);
        })
    }); 

    window.addEventListener('resize', () => {
        resizeCanvas(canvas, ctx);
        requestAnimationFrame(()=> {
            draw(ctx, [translateX, translateY]);
        })
    });
}

main();