#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def build_styles():
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='ReportTitle', parent=styles['Title'], fontName='Helvetica-Bold', fontSize=22, leading=28, textColor=colors.HexColor('#1f2937'), spaceAfter=14))
    styles.add(ParagraphStyle(name='SectionHeader', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=13, leading=17, textColor=colors.HexColor('#111827'), spaceBefore=8, spaceAfter=8))
    styles.add(ParagraphStyle(name='Meta', parent=styles['BodyText'], fontName='Helvetica', fontSize=9.5, leading=12, textColor=colors.HexColor('#4b5563'), spaceAfter=2))
    styles.add(ParagraphStyle(name='Body', parent=styles['BodyText'], alignment=TA_LEFT, fontName='Helvetica', fontSize=10.5, leading=14, textColor=colors.HexColor('#111827'), spaceAfter=6))
    styles.add(ParagraphStyle(name='CandidateHeader', parent=styles['Heading3'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=colors.HexColor('#0f172a'), spaceAfter=6))
    styles.add(ParagraphStyle(name='ReportBullet', parent=styles['BodyText'], fontName='Helvetica', fontSize=10, leading=13, leftIndent=10, bulletIndent=0, spaceAfter=4))
    return styles


def p(text, style):
    return Paragraph(text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'), style)


def build_story(report):
    styles = build_styles()
    story = []
    story.append(p('Professional Run Report', styles['ReportTitle']))
    story.append(p(f"Run ID: {report['run_id']}", styles['Meta']))
    story.append(p(f"Subject: @{report['subject_handle']}", styles['Meta']))
    story.append(p(f"Created at: {report['created_at']}", styles['Meta']))
    story.append(p(f"Payload agents: {', '.join(report['payload_agents']) or 'unknown'}", styles['Meta']))
    story.append(Spacer(1, 0.18 * inch))
    story.append(p('Executive Summary', styles['SectionHeader']))
    story.append(p(report['executive_summary'], styles['Body']))
    story.append(p('Subject Signal Summary', styles['SectionHeader']))
    story.append(p(report['subject_signal_summary'], styles['Body']))
    story.append(p('Ranked Candidates', styles['SectionHeader']))
    ranked = report.get('ranked_candidates', [])
    if not ranked:
        story.append(p('No ranked candidates were emitted in this run.', styles['Body']))
    else:
        for candidate in ranked:
            story.append(p(f"{candidate['rank']}. @{candidate['handle']} - {candidate['compatibility_score']}", styles['CandidateHeader']))
            info = Table([
                ['Caution band', str(candidate['caution_band']).title()],
                ['Explanation', candidate['explanation']],
                ['Suggested opener', candidate['opener_suggestion']],
                ['Source links', '<br/>'.join(candidate['source_links']) if candidate['source_links'] else 'None provided'],
            ], colWidths=[1.55 * inch, 4.85 * inch])
            info.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f8fafc')),
                ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#111827')),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9.5),
                ('LEADING', (0, 0), (-1, -1), 12),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1d5db')),
                ('BOX', (0, 0), (-1, -1), 0.75, colors.HexColor('#cbd5e1')),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(info)
            story.append(Spacer(1, 0.16 * inch))
    story.append(p('Cautions and Unknowns', styles['SectionHeader']))
    cautions = report.get('cautions_and_unknowns', [])
    if not cautions:
        story.append(p('None recorded.', styles['Body']))
    else:
        for item in cautions:
            story.append(Paragraph(f'• {item}', styles['ReportBullet']))
    story.append(p('Operator Next Actions', styles['SectionHeader']))
    for item in report.get('operator_next_actions', []):
        story.append(Paragraph(f'• {item}', styles['ReportBullet']))
    story.append(p('Advisory Boundary', styles['SectionHeader']))
    story.append(p(report['advisory_boundary'], styles['Body']))
    return story


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report-json', required=True)
    parser.add_argument('--output-pdf', required=True)
    args = parser.parse_args()
    report_path = Path(args.report_json)
    output_path = Path(args.output_pdf)
    report = json.loads(report_path.read_text())
    output_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(output_path), pagesize=LETTER, leftMargin=0.72 * inch, rightMargin=0.72 * inch, topMargin=0.72 * inch, bottomMargin=0.72 * inch, title=f"Professional Run Report - {report['run_id']}", author='Soul Mate Signal Engine')
    doc.build(build_story(report))


if __name__ == '__main__':
    main()
