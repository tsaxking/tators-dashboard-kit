import { attempt } from 'ts-utils/check';
import { Loop } from 'ts-utils/loop';
import { $Math } from 'ts-utils/math';
import {
    Point,
    Point2D
} from 'math/point';
import { Color } from 'colors/color';
import { type CanvasEvent } from 'canvas/canvas';
import { Drawable, type DrawableEvent } from 'canvas/drawable';
import { Path } from 'canvas';
import { Polygon } from 'canvas';
import { Board } from './board';
import { Stroke } from './stroke';

const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}|:"<>?`~[]\';./=\\,';

export const compress = (num: number) => {
    return attempt(() => {
        if (Math.floor(num) !== num) {
            throw new Error('Number must be an integer');
        }
        const base = chars.length;
        let result = '';
        while (num > 0) {
            result = chars[num % base] + result;
            num = Math.floor(num / base);
        }
        return result;
    });
};

export const decompress = (str: string) => {
    return attempt(() => {
        const base = chars.length;
        let num = 0;
        for (let i = 0; i < str.length; i++) {
            num += chars.indexOf(str[i]) * Math.pow(base, str.length - i - 1);
        }
        str = num.toString();

        return parseInt(str);
    });
};


export type WhiteboardState = {
    color: string;
    points: Point2D[];
    clear: boolean;
};

export class Position extends Drawable {
    public readonly shape: Polygon;

    constructor(
        public readonly position: Point,
        public readonly color: Color,
        public readonly number: number
    ) {
        super();

        this.shape = new Polygon([
            this.position.add(new Point(-5, -5)).array,
            this.position.add(new Point(5, -5)).array,
            this.position.add(new Point(5, 5)).array,
            this.position.add(new Point(-5, 5)).array
        ]);

        this.shape.fill = {
            color: this.color.toString('rgb')
        };
    }

    draw(ctx: CanvasRenderingContext2D) {
        this.shape.draw(ctx);

        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        const textWidth = ctx.measureText(this.number.toString()).width;
        ctx.fillText(
            this.number.toString(),
            this.position.x - textWidth / 2,
            this.position.y + 5
        );
    }

    isIn(point: Point2D) {
        return this.shape.isIn(point);
    }
}

// handles each individual state of the board, and handles all the listeners

export class BoardState {
    public static deserialize(data: WhiteboardState, board: Board) {
        return attempt(() => {
            const strokes = new Stroke(data.points, data.color);

            return new BoardState(strokes, board, data.clear);
        });
    }

    public static pathFromStr(str: string) {
        return attempt(() => {
            let temp = true;
            const arr = str.split(' ').reduce(
                (acc, val) => {
                    let arr: [number, number];
                    if (temp) {
                        arr = [decompress(val).unwrap(), 0];
                        acc.push(arr);
                        return acc;
                    }
                    arr = acc[acc.length - 1];
                    arr = [arr[0], decompress(val).unwrap()];
                    temp = !temp;
                    return acc;
                },
                [] as [number, number][]
            );

            return new Path(arr);
        });
    }

    public static pathToStr(path: Path) {
        return attempt(() => {
            const grow = (num: number) =>
                Math.round($Math.roundTo(4, num) * 10000);
            const arr = path.points.reduce((acc, val) => {
                return (
                    acc +
                    compress(grow(val[0])).unwrap() +
                    ' ' +
                    compress(grow(val[1])).unwrap() +
                    ' '
                );
            }, '');
            return arr;
        });
    }

    constructor(
        public stroke: Stroke,
        public readonly board: Board,
        public clear: boolean = false
    ) {}

    draw(ctx: CanvasRenderingContext2D) {
        this.stroke.draw(ctx);
    }

    serialize(): WhiteboardState {
        return {
            color: this.stroke.color,
            points: this.stroke.points as Point2D[],
            clear: this.clear
        };
    }

    clone() {
        return BoardState.deserialize(this.serialize(), this.board);
    }

    setListeners() {
        return attempt(() => {
            const round = (num: number) => $Math.roundTo(4, num);
            const canvas = this.board.canvas;
            if (!canvas) throw new Error('Canvas not found');
            type E = (
                data: DrawableEvent<unknown> | CanvasEvent<unknown>
            ) => void;
            type E_FN = (
                e:
                    | DrawableEvent<MouseEvent | TouchEvent>
                    | CanvasEvent<MouseEvent | TouchEvent>
            ) => void;

            let point: Point2D | undefined;

            const push = () => {
                if (!point) return;
                const [x, y] = point;
                point = undefined;
                this.board.drawingStroke.points.push([round(x), round(y)]);
            };

            const loop = new Loop(() => {
                push();
            }, 30);

            let drawing = false;

            const set = (x: number, y: number) => (point = [x, y]);

            const start: E_FN = e => {
                drawing = true;
                loop.start();
                const [[x, y]] = canvas.getXY(e.event);
                set(x, y);
            };
            const draw: E_FN = e => {
                if (!drawing) return;
                const canvas = this.board.canvas;
                if (!canvas) return;
                const [[x, y]] = canvas.getXY(e.event);
                set(x, y);
            };
            const end: E_FN = () => {
                if (!drawing) return;
                drawing = false;
                loop.stop();
                const clone = this.clone().unwrap();
                clone.clear = false;
                clone.stroke = this.board.drawingStroke.clone();
                this.board.push(clone);
                this.board.drawingStroke = new Stroke([], this.board.color);
            };

            this.board.on('mousedown', start as E);
            this.board.on('mousemove', draw as E);
            this.board.on('mouseup', end as E);
            this.board.on('mouseleave', end as E);
            this.board.on('touchstart', start as E);
            this.board.on('touchmove', draw as E);
            this.board.on('touchend', end as E);
            this.board.on('touchcancel', end as E);
            canvas.on('touchcancel', end as E);
            canvas.on('touchend', end as E);
        });
    }

    removeListeners() {
        this.board.off('mousedown');
        this.board.off('mousemove');
        this.board.off('mouseup');
        this.board.off('mouseleave');
        this.board.off('touchstart');
        this.board.off('touchmove');
        this.board.off('touchend');
        this.board.off('touchcancel');

        this.board.canvas?.emitter.off('touchcancel');
        this.board.canvas?.emitter.off('touchend');
    }
}
