import { describe, it, expect } from "vitest";
import LandingLoading from "./loading";
import { BookingGridSkeleton } from "@/components/booking/BookingGridSkeleton";

type VNode = {
    type?: unknown;
    props?: {
        children?: unknown;
    };
};

describe("LandingLoading", () => {
    it("renders the 2-column split hero layout and court wireframe", () => {
        const tree = LandingLoading();
        expect(tree).toBeDefined();

        const json = JSON.stringify(tree);

        // Must contain 2-column desktop grid
        expect(json).toContain("lg:grid-cols-12");

        // Must contain the simulator card container
        expect(json).toContain("rounded-3xl");

        // Must contain court simulator wireframe SVG with 260 144 viewBox
        expect(json).toContain("0 0 260 144");

        // Must contain quick-slots container
        expect(json).toContain("grid-cols-2 sm:grid-cols-4");

        // Traverse tree to find BookingGridSkeleton element without explicit any
        const findElement = (node: unknown, targetType: unknown): boolean => {
            if (!node || typeof node !== "object") return false;
            const vnode = node as VNode;
            if (vnode.type === targetType) return true;
            if (vnode.props?.children) {
                const children = Array.isArray(vnode.props.children)
                    ? vnode.props.children
                    : [vnode.props.children];
                return children.some((c: unknown) => findElement(c, targetType));
            }
            return false;
        };

        expect(findElement(tree, BookingGridSkeleton)).toBe(true);
    });
});
