import { Canvas, Container, Path, Circle, Img, SVG } from "canvas";
import type { TraceArray, Action } from "tatorscout-utils/trace";

const generateAction = (x: number, y: number, action: Action, color: string) => {
    const c = new Circle([x, y], 5);
    c.fill.color = color;
    const svg = new SVG(`/icons/${action}.svg`, [x, y]);
    svg.text.color = 'black';
    return new Container(
        c,
        svg,
    );
}

export class MatchCanvas {
    private doActions = true;
    private doPath = true;
    private min = 0;
    private max = 600; // 150 seconds * 4 frames per second

    private readonly canvas: Canvas;
    private readonly container = new Container();
    private readonly background: Img;

    constructor(
        public readonly trace: TraceArray,
        public readonly year: number,
        public readonly ctx: CanvasRenderingContext2D,
        public readonly actionColors: Record<Action, string>,
    ) {
        this.canvas = new Canvas(ctx);
        this.background = new Img(`/${year}field.png`);

        this.init();
    }

    init() {
        this.canvas.clearDrawables();
        this.container.children = [];
        this.background.width = 1;
        this.background.height = 1;
        this.background.x = 0;
        this.background.y = 0;
        // start at 1 to skip the first point, a path is drawn between two points, so we're starting with the second
        for (let i = 1; i < this.trace.length; i++) {
            const a = this.trace[i - 1];
            const [,x1, y1, a1] = a;
            const b = this.trace[i];
            const [,x2, y2, a2] = b;

            // Need the i == 1 check otherwise every action will be drawn twice
            if (a1 && i == 1) {
                this.container.children.push(
                    generateAction(x1, y1, a1, this.actionColors[a1])
                );
            }
            const path = new Path([[x1, y1], [x2, y2]]);

            this.container.children.push(path);

            if (a2) {
                this.container.children.push(
                    generateAction(x2, y2, a2, this.actionColors[a2])
                );
            }
        }
        this.canvas.add(this.background, this.container);
    }

    between(min: number, max: number) {
        this.min = min * 4;
        this.max = max * 4;
        this.setFilter();
    }

    auto() {
        this.between(0, 15);
    }

    teleop() {
        this.between(15, 135);
    }

    endgame() {
        this.between(135, 150);
    }

    hideActions() {
        this.doActions = false;
        this.setFilter();
    }

    showActions() {
        this.doActions = true;
        this.setFilter();
    }

    toggleActions() {
        this.doActions = !this.doActions;
        this.setFilter();
    }

    showPath() {
        this.doPath = true;
        this.setFilter();
    }

    hidePath() {
        this.doPath = false;
        this.setFilter();
    }

    togglePath() {
        this.doPath = !this.doPath;
        this.setFilter();
    }

    reset() {
        this.doActions = true;
        this.doPath = true;
        this.min = 0;
        this.max = 600;
        this.init();
        this.setFilter();
    }

    private setFilter() {
        let actions = 0;
        this.container.filter((drawable, i) => {
            // I subtract actions from i because the action adds to the number of total items, which will move the actual time of the item off by the number of actions before the current drawable
            if (i - actions < this.min || i - actions > this.max) return false;

            if (!drawable) return false;

            if (drawable instanceof Path) {
                if (this.doPath) {
                    return true;
                }
                return false;
            }

            if (drawable instanceof Container) {
                actions++;
                if (this.doActions) {
                    return true;
                }
                return false;
            }

            return false;
        });
    }

    animate() {
        return this.canvas.animate();
    }

    draw() {
        this.canvas.draw();
    }
}