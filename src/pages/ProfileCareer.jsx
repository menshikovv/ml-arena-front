import { BriefcaseBusiness, Pencil, ShieldCheck, UserRoundSearch } from "lucide-react";
import { Link } from "react-router-dom";
import "./ProfileCareer.css";

const displayValue = (value) => value === null || value === undefined || value === "" ? "—" : value;
const yesNo = (value) => value === null || value === undefined ? "—" : value ? "Да" : "Нет";

function DetailRow({ label, value, section }) {
  return (
    <div className="passport-career__row">
      <span className="passport-career__label">{label}</span>
      <strong className="passport-career__value">{displayValue(value)}</strong>
      <Link
        className="passport-career__edit"
        to={`/profile/edit#${section}`}
        aria-label={`Изменить: ${label}`}
        title={`Изменить: ${label}`}
      >
        <Pencil size={19} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  );
}

function DetailPanel({ icon: Icon, decoration: Decoration, title, description, rows }) {
  return (
    <section className="passport-career__panel">
      <div className="passport-career__art" aria-hidden="true" />
      <Decoration className="passport-career__decoration" size={94} strokeWidth={1.4} aria-hidden="true" />
      <div className="passport-career__icon"><Icon size={25} strokeWidth={2.1} aria-hidden="true" /></div>
      <h2>{title}</h2>
      <p className="passport-career__description">{description}</p>
      <div className="passport-career__rows">{rows.map((row) => <DetailRow key={row.label} {...row} />)}</div>
    </section>
  );
}

export default function ProfileCareer({ profile }) {
  const personalRows = [
    { label: "Возраст", value: profile.age, section: "profile-location" },
    { label: "Пол", value: profile.gender === "male" ? "Мужской" : profile.gender === "female" ? "Женский" : null, section: "profile-location" },
    { label: "Город", value: profile.city, section: "profile-location" },
    { label: "Университет", value: profile.university, section: "profile-education" },
    { label: "Компания", value: profile.company, section: "profile-work" },
    { label: "Доступен компаниям", value: yesNo(profile.visible_to_employers), section: "profile-visibility" },
  ];
  const visibilityRows = [
    { label: "Публичный профиль", value: yesNo(profile.public_profile), section: "profile-visibility" },
    { label: "Показывать имя и фамилию", value: yesNo(profile.show_real_name), section: "profile-visibility" },
    { label: "Показывать карьерные данные", value: yesNo(profile.show_career_details), section: "profile-visibility" },
  ];

  return (
    <div className="passport-career">
      <DetailPanel
        icon={BriefcaseBusiness}
        decoration={BriefcaseBusiness}
        title="Личные и карьерные данные"
        description="Информация о вас, которая отображается в профиле."
        rows={personalRows}
      />
      <DetailPanel
        icon={UserRoundSearch}
        decoration={ShieldCheck}
        title="Публичность"
        description="Управляйте отображением вашего профиля."
        rows={visibilityRows}
      />
    </div>
  );
}
