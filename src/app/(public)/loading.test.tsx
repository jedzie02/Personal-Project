import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import LandingLoading from "./loading";
import BookLoading from "@/app/book/loading";
import { BookingGridSkeleton } from "@/components/booking/BookingGridSkeleton";

vi.mock("@/components/Navbar", () => ({
    Navbar: () => <header data-testid="mock-navbar">Navbar</header>,
}));

type VNode = {
    type?: unknown;
    props?: {
        children?: unknown;
    };
};

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

describe("LandingLoading", () => {
    it("renders the static split hero layout without BookingGridSkeleton", () => {
        const tree = LandingLoading();
        expect(tree).toBeDefined();

        const html = renderToStaticMarkup(tree);

        // Must contain 2-column desktop grid
        expect(html).toContain("lg:grid-cols-12");

        // Must contain the static headline
        expect(html).toContain("Effortless booking for your next");

        // Must contain the simulator card container
        expect(html).toContain("rounded-3xl");

        // Must contain quick-slots container
        expect(html).toContain("grid-cols-2 sm:grid-cols-4");

        // Landing page MUST NOT contain BookingGridSkeleton
        expect(findElement(tree, BookingGridSkeleton)).toBe(false);
    });
});

describe("BookLoading", () => {
    it("renders the booking grid skeleton for /book", () => {
        const tree = BookLoading();
        expect(tree).toBeDefined();

        // /book loading MUST contain BookingGridSkeleton
        expect(findElement(tree, BookingGridSkeleton)).toBe(true);
    });
});
