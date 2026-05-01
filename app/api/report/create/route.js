import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { sendEmailByTemplate } from "../../../lib/genral-mail";
export async function POST(req) {
    try {
        const { logoId, logoName, reason, reporterEmail } = await req.json();
        if (!logoId || !logoName || !reason || !reporterEmail) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const report = await prisma.report.create({
            data: { logoId, logoName, reason, reporterEmail },
        });
        sendEmailByTemplate({
            to: reporterEmail,
            templateKey: "dmca_notice_received",
            variables: {
                email: reporterEmail,
                logoName,
                reason,
                reportId: report.id,
            },
        }).catch((err) => console.error("[dmca] Email send failed:", err.message));
        return NextResponse.json({ success: true, report });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // optional filter

        const reports = await prisma.report.findMany({
            where: status ? { status } : undefined,
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json({ reports });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}




export async function PATCH(req) {
    try {
        const { id, status } = await req.json();
        if (!id || !status) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const report = await prisma.report.update({
            where: { id },
            data: { status },
        });

        if (status === "resolved" && report.reporterEmail) {
            sendEmailByTemplate({
                to: report.reporterEmail,
                templateKey: "dmca_resolution",
                variables: {
                    email: report.reporterEmail,
                    logoName: report.logoName,
                    reportId: report.id,
                    status,
                },
            }).catch((err) => console.error("[dmca] Resolution email failed:", err.message));
        }
        return NextResponse.json({ success: true, report });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}