/*
STIGMERGY REVIEW HEADER
Status: Pending verification
Review started: 2025-09-16T19:48-06:00
Expires: 2025-09-23T19:48-06:00 (auto-expire after 7 days)

Checklist:
 - [ ] Re-evaluate this artifact against current Hexagonal goals
 - [ ] Verify dependent modules and update factorization notes
 - [ ] Log decisions in TODO_2025-09-16.md
*/

// TelemetryManager: build low-PII envelopes from page hooks and enforce schema before sink
// Lightweight adapter; can be swapped or no-op in demos.
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors:true, strict:false });

const envelopeSchema = {
  type: 'object',
  properties: {
    downs: { type:'integer', minimum:0 },
    ups: { type:'integer', minimum:0 },
    specCancelRate: { type:'number', minimum:0 },
    meanDownLatency: { type:'number', minimum:0 },
    frames: { type:'integer', minimum:0 },
    label: { type:'string' },
  },
  required: ['downs','ups','specCancelRate','meanDownLatency','frames'],
  additionalProperties: false
};

const validateEnvelope = ajv.compile(envelopeSchema);

export class TelemetryManager {
  constructor(sink){ this.sink=sink||null; }
  snapshotFromPage(label){
    const snap = (typeof window!=='undefined' && window.__getTelemetry) ? window.__getTelemetry() : null;
    if(!snap) return null;
    const env = { ...snap, label };
    if(!validateEnvelope(env)){
      return { __invalid: true, errors: validateEnvelope.errors, env };
    }
    return env;
  }
  async emit(env){ if(!env || env.__invalid) return false; if(this.sink && typeof this.sink.emit==='function'){ await this.sink.emit(env); return true; } return true; }
}
