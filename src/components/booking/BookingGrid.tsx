"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, CheckCircle2, Clock, Calendar, MapPin, DollarSign, CalendarCheck } from "lucide-react";
import type { BookingGridData } from "@/lib/services/booking-grid.service";
import { PRICE_PER_HOUR } from "@/lib/config/booking-rules";

interface SelectedSlot {
    courtId: string;
    courtName: string;
    hour: string;
}

function formatAMPM(timeStr: string) {
    const [hStr, mStr] = timeStr.split(":");
    let h = parseInt(hStr, 10);
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    const hFormatted = h.toString().padStart(2, "0");
    return `${hFormatted}:${mStr} ${ampm}`;
}

function formatDate(dateStr: string) {
    try {
        const [y, m, d] = dateStr.split("-").map(Number);
        if (!y || !m || !d) return dateStr;
        const dateObj = new Date(y, m - 1, d);
        return dateObj.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return dateStr;
    }
}

export default function BookingGrid({ data }: { data: BookingGridData }) {
    const { courts, hours, grid, date } = data;
    const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

    const courtMap = new Map(courts.map((court) => [court.id, court.name]));

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setSelectedSlot(null);
            }
        };

        if (selectedSlot) {
            document.body.style.overflow = "hidden";
            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [selectedSlot]);

    return (
        <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Header Title */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <Clock className="w-5 h-5 text-blue-500" />
                <h2 className="text-[19px] font-bold text-gray-900">Available Times</h2>
            </div>

            {/* Grid */}
            <div className="relative overflow-x-auto w-full">
                <table className="w-full border-collapse table-fixed min-w-[700px]">
                    {/* Court headers */}
                    <thead>
                        <tr>
                            <th className="w-44 py-4 px-2 text-center text-sm font-semibold text-gray-500 border-b border-r border-slate-100 bg-white">
                                Time
                            </th>
                            {courts.map((court, idx) => (
                                <th
                                    key={court.id}
                                    className={`py-4 px-2 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-slate-100 bg-white ${
                                        idx !== courts.length - 1 ? "border-r" : ""
                                    }`}
                                >
                                    {court.name}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {hours.map((hour, hourIdx) => {
                            const hourNum = parseInt(hour.split(":")[0], 10);
                            const nextHour = `${(hourNum + 1).toString().padStart(2, "0")}:00`;

                            return (
                                <tr
                                    key={hour}
                                    className="group border-b border-slate-100 last:border-b-0"
                                >
                                    {/* Time label */}
                                    <td className="px-2 py-4 text-center align-middle border-r border-slate-100 bg-white">
                                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                                            {formatAMPM(hour)} - {formatAMPM(nextHour)}
                                        </span>
                                    </td>

                                    {/* Court cells */}
                                    {grid[hourIdx].map((cell, courtIdx) => {
                                        if (cell.hidden) return null;

                                        const rowSpan = cell.rowSpan ?? 1;

                                        return (
                                            <td
                                                key={cell.courtId}
                                                rowSpan={rowSpan}
                                                className={`p-1.5 align-middle bg-white ${
                                                    courtIdx !== courts.length - 1 ? "border-r border-slate-100" : ""
                                                }`}
                                            >
                                                <CellContent
                                                    cell={cell}
                                                    courtName={courtMap.get(cell.courtId) || "Court"}
                                                    rowSpan={rowSpan}
                                                    onSelectSlot={setSelectedSlot}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Popup Modal */}
            {selectedSlot && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                    onClick={() => setSelectedSlot(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="available-slot-modal-title"
                >
                    <div
                        className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Top Icon Badge */}
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 text-blue-600 mb-4 border border-blue-100 shadow-xs">
                            <CalendarCheck className="w-7 h-7" />
                        </div>

                        {/* Modal Header */}
                        <h3 id="available-slot-modal-title" className="text-xl font-bold text-gray-900">
                            Court Slot Available
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs">
                            This court slot is available for booking. Review your court details below.
                        </p>

                        {/* Slot Details Card */}
                        <div className="w-full mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-left divide-y divide-slate-100">
                            <div className="flex items-center justify-between pb-2.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" /> Court
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {selectedSlot.courtName}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" /> Date
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {formatDate(date)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-blue-500" /> Time
                                </span>
                                <span className="text-sm font-semibold text-gray-900">
                                    {formatAMPM(selectedSlot.hour)} – {formatAMPM(addHours(selectedSlot.hour, 1))}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2.5">
                                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-blue-500" /> Rate
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                    ${PRICE_PER_HOUR.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Actions (Centered: Back button and Book button) */}
                        <div className="flex items-center justify-center gap-3 w-full mt-6">
                            <button
                                type="button"
                                onClick={() => setSelectedSlot(null)}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-xs cursor-pointer"
                            >
                                Back
                            </button>
                            <Link
                                href={`/book/review?date=${date}&start=${selectedSlot.hour}&end=${encodeURIComponent(
                                    addHours(selectedSlot.hour, 1)
                                )}&courtId=${selectedSlot.courtId}`}
                                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm text-center cursor-pointer"
                            >
                                Book Slot
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CellContent({
    cell,
    courtName,
    rowSpan,
    onSelectSlot,
}: {
    cell: BookingGridData["grid"][0][0];
    courtName: string;
    rowSpan: number;
    onSelectSlot: (slot: SelectedSlot) => void;
}) {
    const heightClass = rowSpan > 1 ? "h-full" : "";
    const minHeight = `${rowSpan * 48}px`;

    switch (cell.status) {
        case "passed":
            return (
                <div
                    className={`w-full rounded-[14px] bg-slate-50 flex items-center justify-center ${heightClass} py-3`}
                    style={{ minHeight }}
                >
                    <span className="text-sm font-semibold text-slate-400 uppercase">Passed</span>
                </div>
            );

        case "booked":
            return (
                <div
                    className={`
                        w-full rounded-[14px] overflow-hidden ${heightClass}
                        bg-slate-100
                        flex flex-col items-center justify-center gap-1 py-3
                    `}
                    style={{ minHeight }}
                >
                    <Lock className="size-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-400 uppercase">
                        Booked
                    </span>
                </div>
            );

        case "fulfilled":
            return (
                <div
                    className={`
                        w-full rounded-[14px] overflow-hidden ${heightClass}
                        bg-slate-100
                        flex flex-col items-center justify-center gap-1 py-3
                    `}
                    style={{ minHeight }}
                >
                    <CheckCircle2 className="size-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-400 uppercase">
                        Fulfilled
                    </span>
                </div>
            );

        case "available":
            return (
                <button
                    type="button"
                    onClick={() =>
                        onSelectSlot({
                            courtId: cell.courtId,
                            courtName,
                            hour: cell.hour,
                        })
                    }
                    className={`
                        w-full rounded-[14px] ${heightClass} py-2
                        bg-blue-50/50 border border-blue-200 hover:bg-blue-500 hover:border-blue-500
                        flex items-center justify-center
                        transition-all duration-200 group/cell cursor-pointer block
                    `}
                    style={{ minHeight }}
                >
                    <span className="text-sm font-semibold text-blue-600 capitalize group-hover/cell:text-white transition-colors duration-200">
                        Available
                    </span>
                </button>
            );

        case "closed":
            return (
                <div
                    className={`w-full rounded-[14px] bg-slate-50 flex items-center justify-center ${heightClass} py-3`}
                    style={{ minHeight }}
                >
                    <span className="text-sm font-semibold text-slate-400 uppercase">Closed</span>
                </div>
            );
    }
}

function addHours(time: string, hours: number): string {
    const h = parseInt(time.split(":")[0], 10) + hours;
    return `${h.toString().padStart(2, "0")}:00`;
}
