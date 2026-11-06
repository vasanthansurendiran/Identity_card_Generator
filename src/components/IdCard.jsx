import React from 'react';
import FitText from './FitText.jsx';
import './IdCard.css';

const A = (n) => `${import.meta.env.BASE_URL}assets/${n}.png`;

/** Fixed 1083x1693 design-unit card, matching the KSVM sample layout. */
export default function IdCard({ student: s, photoUrl, settings: c }) {
  const name = (s.name || '').toUpperCase();
  return (
    <div className="id-card" style={{ '--head': c.headerColor, '--accent': c.accentColor }}>
      <div className="ic-header">
        <img className="ic-logo" src={c.logo} alt="" />
        <FitText className="ic-school" max={210} min={60}>{c.schoolName}</FitText>
        <FitText className="ic-addr1" max={42} min={20}>{c.addressLine1}</FitText>
        <div className="ic-addr2">
          <FitText max={42} min={20} style={{ width: 480 }}>{c.addressLine2}</FitText>
          <FitText max={42} min={20} style={{ width: 360, textAlign: 'right' }}>{c.schoolPhone}</FitText>
        </div>
      </div>

      <div className="ic-title">{c.title}</div>
      <div className="ic-year">{c.academicYear}</div>

      <div className="ic-photo">
        {photoUrl ? <img src={photoUrl} alt="" /> : <div className="ic-nophoto">NO PHOTO</div>}
      </div>

      <FitText className="ic-box" style={{ top: 488 }} max={46} min={20}>{s.class}</FitText>
      <FitText className="ic-box" style={{ top: 597 }} max={46} min={20}>{s.admission}</FitText>

      <img className="ic-icon" src={A('icon-cake')} style={{ left: 635, top: 710, width: 84 }} alt="" />
      <FitText className="ic-info blue" style={{ top: 727 }} max={46} min={20}>{s.dob}</FitText>
      <img className="ic-icon" src={A('icon-blood')} style={{ left: 638, top: 815, width: 70 }} alt="" />
      <FitText className="ic-info red" style={{ top: 842 }} max={46} min={20}>{s.blood}</FitText>
      <img className="ic-icon" src={A('icon-bus')} style={{ left: 630, top: 955, width: 112 }} alt="" />
      <FitText className="ic-info blue" style={{ top: 965 }} max={46} min={20}>{s.bus}</FitText>

      <FitText className="ic-name" max={62} min={22}>{name}</FitText>

      <img className="ic-icon" src={A('icon-home')} style={{ left: 68, top: 1190, width: 40 }} alt="" />
      <div className="ic-addrlabel">Address :</div>
      <FitText className="ic-parent" max={38} min={18}>{s.parent}</FitText>
      <FitText className="ic-address" multiline max={34} min={14}>{s.address}</FitText>

      <img className="ic-icon" src={A('icon-phone')} style={{ left: 74, top: 1556, width: 62 }} alt="" />
      <FitText className="ic-phone" max={52} min={22}>{s.cell}</FitText>
      {c.footerText ? <FitText className="ic-footer" max={29} min={14}>{c.footerText}</FitText> : null}

      {c.signature ? <img className="ic-sign" src={c.signature} alt="" /> : null}
      <div className="ic-principal">{c.designation}</div>
    </div>
  );
}
