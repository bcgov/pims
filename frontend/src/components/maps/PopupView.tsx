import * as React from 'react';
import { IBuilding, IParcel, PropertyTypes } from 'actions/parcelsActions';
import { ParcelPopupView } from './ParcelPopupView';
import { BuildingPopupView } from './BuildingPopupView';

export type IPopupViewProps = {
  propertyTypeId: PropertyTypes; // 0 = Parcel, 1 = Building
  propertyDetail: IParcel | IBuilding | null;
  zoomTo?: () => void;
  disabled?: boolean;
  onLinkClick?: () => void;
};

export const PopupView: React.FC<IPopupViewProps> = ({
  propertyTypeId,
  propertyDetail,
  disabled,
  zoomTo,
  onLinkClick,
}) => {
  if (propertyTypeId === PropertyTypes.PARCEL) {
    return (
      <ParcelPopupView
        zoomTo={zoomTo}
        disabled={disabled}
        parcel={propertyDetail as IParcel}
        onLinkClick={onLinkClick}
      />
    );
  }
  if (propertyTypeId === PropertyTypes.BUILDING) {
    return (
      <BuildingPopupView
        zoomTo={zoomTo}
        building={propertyDetail as IBuilding}
        onLinkClick={onLinkClick}
      />
    );
  }
  if (propertyTypeId === PropertyTypes.DRAFT_PARCEL) {
    return <p>This is a draft marker for parcel: {propertyDetail?.name ?? 'New Parcel'}</p>;
  }
  if (propertyTypeId === PropertyTypes.DRAFT_BUILDING) {
    return <p>This is a draft marker for building: {propertyDetail?.name ?? 'New Building'}</p>;
  }
  return null;
};
