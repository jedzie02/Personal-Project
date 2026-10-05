import Link from "next/link";
import type { Court } from "@/lib/types/domain";
import { setCourtActiveStatusAction } from "@/app/admin/courts/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * This component's only job is to DISPLAY courts and wire up the
 * buttons — it doesn't fetch data itself (that's the page's job)
 * and it doesn't contain business logic (that's the service's job).
 * That separation is what "components handle presentation" means
 * in practice, not just in theory.
 *
 * Note there's no "use client" here — this renders on the server.
 * The activate/deactivate buttons still work without client-side
 * JavaScript state, because each one is its own tiny <form> bound
 * to a Server Action, using the court's id captured in a closure.
 */
export function CourtsTable({
    courts,
    warnCourtId,
}: {
    courts: Court[];
    warnCourtId?: string;
}) {
    if (courts.length === 0) {
        return <p className="text-muted-foreground">No courts yet — add one above.</p>;
    }

    return (
        <Table className="w-full max-w-2xl">
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {courts.map((court) => {
                    const toggleStatus = setCourtActiveStatusAction.bind(
                        null,
                        court.id,
                        !court.isActive
                    );

                    return (
                        <TableRow key={court.id}>
                            <TableCell className="font-medium">{court.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {court.description ?? "—"}
                            </TableCell>
                            <TableCell>
                                <Badge variant={court.isActive ? "default" : "secondary"} className={court.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                                    {court.isActive ? "Active" : "Inactive"}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex gap-3 items-center">
                                <Link href={`/admin/courts/${court.id}/edit`} className="text-sm underline underline-offset-4 hover:text-primary">
                                    Edit
                                </Link>
                                <form action={toggleStatus}>
                                    <Button variant="outline" size="sm" type="submit">
                                        {court.isActive ? "Deactivate" : "Activate"}
                                    </Button>
                                </form>

                                {warnCourtId === court.id && (
                                    <form action={toggleStatus}>
                                        <input type="hidden" name="confirmed" value="true" />
                                        <Button variant="destructive" size="sm" type="submit">
                                            Confirm deactivate anyway
                                        </Button>
                                    </form>
                                )}
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}