import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faBan,
  faBell,
  faBolt,
  faBox,
  faBoxesStacked,
  faCalendarDays,
  faCartShopping,
  faChartColumn,
  faCheck,
  faCircleExclamation,
  faCoins,
  faDatabase,
  faGamepad,
  faGaugeHigh,
  faGlobe,
  faLink,
  faMagnifyingGlass,
  faMoneyBillTransfer,
  faNewspaper,
  faPalette,
  faPenToSquare,
  faServer,
  faShieldHalved,
  faStar,
  faTerminal,
  faTrophy,
  faUser,
  faUsers,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

export {
  faBan,
  faBell,
  faBolt,
  faBox,
  faBoxesStacked,
  faCalendarDays,
  faCartShopping,
  faChartColumn,
  faCheck,
  faCircleExclamation,
  faCoins,
  faDatabase,
  faGamepad,
  faGaugeHigh,
  faGlobe,
  faLink,
  faMagnifyingGlass,
  faMoneyBillTransfer,
  faNewspaper,
  faPalette,
  faPenToSquare,
  faServer,
  faShieldHalved,
  faStar,
  faTerminal,
  faTrophy,
  faUser,
  faUsers,
  faXmark,
};

export function AdminIcon({
  icon,
  className,
}: {
  icon: IconDefinition;
  className?: string;
}) {
  return <FontAwesomeIcon icon={icon} className={className} aria-hidden="true" />;
}
