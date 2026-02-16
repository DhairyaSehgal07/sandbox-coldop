import { memo } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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

const TITLE = 'Incoming gate pass pdf';

export const IncomingGatePassPdf = memo(function IncomingGatePassPdf() {
  return (
    <Document title={TITLE} creator="Coldop">
      <Page size="A4" style={styles.body}>
        <Text style={styles.header} fixed>
          ~ Gate pass ~
        </Text>
        <View>
          <Text style={styles.title}>{TITLE}</Text>
          <Text style={styles.subtitle}>Generated from daybook · Coldop</Text>
        </View>
      </Page>
    </Document>
  );
});
