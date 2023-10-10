import './SresManual.scss';

import * as React from 'react';
import { FiBookOpen } from 'react-icons/fi';

interface ISresManualProps {
  clickUrl?: string;
  hideText?: boolean;
}

const SresManual: React.FunctionComponent<ISresManualProps> = ({
  clickUrl,
  hideText,
}: ISresManualProps) => {
  const link =
    clickUrl ??
    'https://intranet.gov.bc.ca/assets/intranet/mtics/real-property/who-we-are/branch-sres/process_manual_for_the_surplus_properties_program_-_feb_2020_-_version_2.pdf';
  return (
    <div className="SresManual" onClick={() => window.open(link, '_blank')}>
      <div>
        <FiBookOpen size={28} />
      </div>
      {!hideText && (
        <p>
          <b>Process Manual</b> <br />
          for the Surplus <br /> Properties Program
        </p>
      )}
    </div>
  );
};

export default SresManual;
