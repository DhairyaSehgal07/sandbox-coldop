import { memo } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';

/* ------------------------------------------------------------------ */
/* Styles (react-pdf StyleSheet – valid units: pt, in, mm, cm, %, vw, vh) */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  body: {
    paddingTop: 35,
    paddingBottom: 65,
    paddingHorizontal: 35,
  },
  header: {
    fontSize: 10,
    marginBottom: 20,
    textAlign: 'center',
    color: '#6f6f6f',
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#6f6f6f',
  },
});

/* ------------------------------------------------------------------ */
/* PDF document component */
/* ------------------------------------------------------------------ */

export type GatePassPdfType = 'incoming' | 'outgoing';

const TITLES: Record<GatePassPdfType, string> = {
  incoming: 'Incoming gate pass pdf',
  outgoing: 'Outgoing gate pass pdf',
};

interface GatePassPdfDocumentProps {
  type: GatePassPdfType;
}

const GatePassPdfDocument = memo(function GatePassPdfDocument({
  type,
}: GatePassPdfDocumentProps) {
  const title = TITLES[type];
  return (
    <Document title={title} creator="Coldop">
      <Page size="A4" style={styles.body}>
        <Text style={styles.header} fixed>
          ~ Gate pass ~
        </Text>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Generated from daybook · Coldop
          </Text>
        </View>
      </Page>
    </Document>
  );
});

/* ------------------------------------------------------------------ */
/* Open PDF in new tab (browser) */
/* ------------------------------------------------------------------ */

/**
 * Renders the gate pass PDF and opens it in a new browser tab.
 * Uses @react-pdf/renderer to generate the blob and URL.createObjectURL.
 */
export async function openGatePassPdfInNewTab(
  type: GatePassPdfType
): Promise<void> {
  const blob = await pdf(<GatePassPdfDocument type={type} />).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  // Revoke after a delay so the new tab can load the blob URL
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export { GatePassPdfDocument };
