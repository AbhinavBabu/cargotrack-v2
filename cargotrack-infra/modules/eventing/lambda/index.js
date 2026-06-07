exports.handler = async (event) => {
  for (const record of event.Records) {
    let body;
    try {
      body = JSON.parse(record.body);
    } catch {
      console.error('[document-processor] Failed to parse SQS message body:', record.body);
      continue;
    }

    console.log('[document-processor] Processing event:', JSON.stringify(body, null, 2));
    console.log('[document-processor] detail-type:', body['detail-type']);
    console.log('[document-processor] detail:', JSON.stringify(body.detail, null, 2));
  }
};
