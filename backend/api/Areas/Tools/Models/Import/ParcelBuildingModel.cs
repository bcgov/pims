using System;
using System.Collections.Generic;

namespace Pims.Api.Areas.Tools.Models.Import
{
    public class ParcelBuildingModel : Pims.Api.Models.BaseModel
    {
        #region Properties
        public int Id { get; set; }

        public int ParcelId { get; set; }

        public int AgencyId { get; set; }

        public string LocalId { get; set; }

        public string Description { get; set; }

        public AddressModel Address { get; set; }

        public double Latitude { get; set; }

        public double Longitude { get; set; }

        public int BuildingConstructionTypeId { get; set; }

        public string BuildingConstructionType { get; set; }

        public int BuildingFloorCount { get; set; }

        public int BuildingPredominateUseId { get; set; }

        public string BuildingPredominateUse { get; set; }

        public int BuildingOccupantTypeId { get; set; }

        public string BuildingOccupantType { get; set; }

        public string BuildingTenancy { get; set; }

        public float RentableArea { get; set; }

        public string OccupantName { get; set; }

        public DateTime? LeaseExpiry { get; set; }

        public bool IsSensitive { get; set; }

        public IEnumerable<BuildingEvaluationModel> Evaluations { get; set; } = new List<BuildingEvaluationModel>();

        public IEnumerable<BuildingFiscalModel> Fiscals { get; set; } = new List<BuildingFiscalModel>();
        #endregion
    }
}
