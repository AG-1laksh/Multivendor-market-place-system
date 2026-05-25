import { Link } from 'react-router-dom';

const Breadcrumbs = ({ items = [] }) => {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm muted-text">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.to && !isLast ? (
              <Link to={item.to} className="transition hover:text-[#FFC107]">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-white' : ''}>{item.label}</span>
            )}
            {!isLast && <span className="opacity-70">&gt;</span>}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
