import React from 'react';
import IdCard from './IdCard.jsx';
import { CARD_W, CARD_H } from '../utils/sheetLayout.js';

/** Display the fixed-size card scaled to a given on-screen width. */
export default function ScaledCard({ student, photoUrl, settings, width = 300 }) {
  const scale = width / CARD_W;
  return (
    <div style={{ width, height: CARD_H * scale, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,.25)', background: '#fff' }}>
      <div className="card-scaler" style={{ transform: `scale(${scale})`, width: CARD_W, height: CARD_H }}>
        <IdCard student={student} photoUrl={photoUrl} settings={settings} />
      </div>
    </div>
  );
}
