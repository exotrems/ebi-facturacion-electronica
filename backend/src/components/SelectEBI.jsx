import React from 'react';

/**
 * SelectEBI - Componente de lista desplegable para catálogos EBI
 */
export default function SelectEBI({
  label,
  name,
  options = [],
  value,
  onChange,
  required = false,
  placeholder = 'Seleccione...',
  valueKey = 'codigo',
  labelKey = 'nombre',
  disabled = false,
  extraInfo = null,
}) {
  return (
    <div className="form-group">
      <label htmlFor={name}>
        {label}
        {required && <span className="required">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value || ''}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className="select-ebi"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt[valueKey]} value={opt[valueKey]}>
            {opt[valueKey]} - {opt[labelKey]}
            {extraInfo && opt[extraInfo] ? ` [${opt[extraInfo]}]` : ''}
          </option>
        ))}
      </select>
    </div>
  );
}
