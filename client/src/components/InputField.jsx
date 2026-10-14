export default function InputField({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium text-mist">{label}</span>
      <input type={type} className="input-field" {...props} />
      {error ? <span className="mt-1.5 block text-xs text-ember">{error}</span> : null}
    </label>
  );
}
