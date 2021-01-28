using Mapster;
using Microsoft.Extensions.Options;
using Pims.Dal.Entities;
using Pims.Dal.Helpers.Extensions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using Entity = Pims.Dal.Entities;
using Model = Pims.Api.Areas.Property.Models.Search;

namespace Pims.Api.Areas.Property.Mapping.Search
{
    public class PropertyMap : IRegister
    {
        #region Variables
        private readonly JsonSerializerOptions _serializerOptions;
        #endregion

        #region Constructors
        /// <summary>
        /// Creates a new instance of a ProjectMap, initializes with specified arguments.
        /// </summary>
        /// <param name="serializerOptions"></param>
        public PropertyMap(IOptions<JsonSerializerOptions> serializerOptions)
        {
            _serializerOptions = serializerOptions.Value;
        }
        #endregion
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<Entity.Parcel, Model.PropertyModel>()
                .Map(dest => dest.PropertyTypeId, src => PropertyTypes.Land)
                .Map(dest => dest.Id, src => src.Id)
                .Map(dest => dest.PID, src => src.ParcelIdentity)
                .Map(dest => dest.PIN, src => src.PIN)
                .Map(dest => dest.ClassificationId, src => src.ClassificationId)
                .Map(dest => dest.Classification, src => src.Classification == null ? null : src.Classification.Name)
                .Map(dest => dest.Name, src => src.Name)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.ProjectNumbers, src => JsonSerializer.Deserialize<IEnumerable<string>>(src.ProjectNumbers ?? "[]", _serializerOptions))
                .Map(dest => dest.IsSensitive, src => src.IsSensitive)

                .Map(dest => dest.AgencyId, src => src.AgencyId)
                .Map(dest => dest.Agency, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? src.Agency.Parent.Name : src.Agency.Name)
                .Map(dest => dest.AgencyCode, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? src.Agency.Parent.Code : src.Agency.Code)
                .Map(dest => dest.SubAgency, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? null : src.Agency.Name)
                .Map(dest => dest.SubAgencyCode, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? null : src.Agency.Code)

                .Map(dest => dest.Latitude, src => src.Location.Y)
                .Map(dest => dest.Longitude, src => src.Location.X)
                .Map(dest => dest.AddressId, src => src.AddressId)
                .Map(dest => dest.Address, src => src.Address == null ? null : $"{src.Address.Address1} {src.Address.Address2}".Trim())
                .Map(dest => dest.Province, src => src.Address == null || src.Address.Province == null ? null : src.Address.Province.Name)
                .Map(dest => dest.AdministrativeArea, src => src.Address == null ? null : src.Address.AdministrativeArea)
                .Map(dest => dest.Postal, src => src.Address == null ? null : src.Address.Postal)
                .Map(dest => dest.LandArea, src => src.LandArea)
                .Map(dest => dest.LandLegalDescription, src => src.LandLegalDescription)
                .Map(dest => dest.Zoning, src => src.Zoning)
                .Map(dest => dest.ZoningPotential, src => src.ZoningPotential)

                .Map(dest => dest.Market, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market) == null ? 0 : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market).Value)
                .Map(dest => dest.MarketFiscalYear, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market) == null ? (int?)null : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market).FiscalYear)
                .Map(dest => dest.NetBook, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook) == null ? 0 : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook).Value)
                .Map(dest => dest.NetBookFiscalYear, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook) == null ? (int?)null : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook).FiscalYear)
                .Map(dest => dest.Assessed, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed) == null ? 0 : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed).Value)
                .Map(dest => dest.AssessedDate, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed) == null ? (DateTime?)null : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed).Date)
                .Map(dest => dest.Appraised, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised) == null ? 0 : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised).Value)
                .Map(dest => dest.AppraisedDate, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised) == null ? (DateTime?)null : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised).Date)

                .Map(dest => dest.ConstructionTypeId, src => 0)
                .Map(dest => dest.PredominateUseId, src => 0)
                .Map(dest => dest.OccupantTypeId, src => 0)
                .Map(dest => dest.FloorCount, src => 0)
                .Map(dest => dest.TransferLeaseOnSale, src => false)
                .Map(dest => dest.RentableArea, src => 0);

            config.NewConfig<Entity.Building, Model.PropertyModel>()
                .Map(dest => dest.PropertyTypeId, src => PropertyTypes.Building)
                .Map(dest => dest.Id, src => src.Id)
                .Map(dest => dest.PID, src => src.Parcels.FirstOrDefault() == null ? null : src.Parcels.FirstOrDefault().Parcel.ParcelIdentity)
                .Map(dest => dest.PIN, src => src.Parcels.FirstOrDefault() == null ? null : src.Parcels.FirstOrDefault().Parcel.PIN)
                .Map(dest => dest.ClassificationId, src => src.ClassificationId)
                .Map(dest => dest.Classification, src => src.Classification == null ? null : src.Classification.Name)
                .Map(dest => dest.Name, src => src.Name)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.ProjectNumbers, src => JsonSerializer.Deserialize<IEnumerable<string>>(src.ProjectNumbers ?? "[]", _serializerOptions))
                .Map(dest => dest.IsSensitive, src => src.IsSensitive)

                .Map(dest => dest.AgencyId, src => src.AgencyId)
                .Map(dest => dest.Agency, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? src.Agency.Parent.Name : src.Agency.Name)
                .Map(dest => dest.AgencyCode, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? src.Agency.Parent.Code : src.Agency.Code)
                .Map(dest => dest.SubAgency, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? null : src.Agency.Name)
                .Map(dest => dest.SubAgencyCode, src => src.Agency == null ? null : src.Agency.ParentId.HasValue ? null : src.Agency.Code)

                .Map(dest => dest.Latitude, src => src.Location.Y)
                .Map(dest => dest.Longitude, src => src.Location.X)
                .Map(dest => dest.AddressId, src => src.AddressId)
                .Map(dest => dest.Address, src => src.Address == null ? null : $"{src.Address.Address1} {src.Address.Address2}".Trim())
                .Map(dest => dest.Province, src => src.Address == null || src.Address.Province == null ? null : src.Address.Province.Name)
                .Map(dest => dest.AdministrativeArea, src => src.Address == null ? null : src.Address.AdministrativeArea)
                .Map(dest => dest.Postal, src => src.Address == null ? null : src.Address.Postal)
                .Map(dest => dest.LandArea, src => src.Parcels.FirstOrDefault() == null ? 0 : src.Parcels.FirstOrDefault().Parcel.LandArea)
                .Map(dest => dest.LandLegalDescription, src => src.Parcels.FirstOrDefault() == null ? null : src.Parcels.FirstOrDefault().Parcel.LandLegalDescription)
                .Map(dest => dest.Zoning, src => src.Parcels.FirstOrDefault() == null ? null : src.Parcels.FirstOrDefault().Parcel.Zoning)
                .Map(dest => dest.ZoningPotential, src => src.Parcels.FirstOrDefault() == null ? null : src.Parcels.FirstOrDefault().Parcel.ZoningPotential)

                .Map(dest => dest.Market, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market) == null ? 0 : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market).Value)
                .Map(dest => dest.MarketFiscalYear, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market) == null ? (int?)null : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.Market).FiscalYear)
                .Map(dest => dest.NetBook, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook) == null ? 0 : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook).Value)
                .Map(dest => dest.NetBookFiscalYear, src => src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook) == null ? (int?)null : src.Fiscals.OrderByDescending(f => f.FiscalYear).FirstOrDefault(f => f.Key == FiscalKeys.NetBook).FiscalYear)
                .Map(dest => dest.Assessed, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed) == null ? 0 : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed).Value)
                .Map(dest => dest.AssessedDate, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed) == null ? (DateTime?)null : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Assessed).Date)
                .Map(dest => dest.Appraised, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised) == null ? 0 : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised).Value)
                .Map(dest => dest.AppraisedDate, src => src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised) == null ? (DateTime?)null : src.Evaluations.OrderByDescending(f => f.Date).FirstOrDefault(f => f.Key == EvaluationKeys.Appraised).Date)

                .Map(dest => dest.ParcelId, src => src.GetParcelId())
                .Map(dest => dest.ConstructionTypeId, src => src.BuildingConstructionTypeId)
                .Map(dest => dest.ConstructionType, src => src.GetConstructionType())
                .Map(dest => dest.PredominateUseId, src => src.BuildingPredominateUseId)
                .Map(dest => dest.PredominateUse, src => src.GetPredominateUse())
                .Map(dest => dest.OccupantTypeId, src => src.BuildingOccupantTypeId)
                .Map(dest => dest.OccupantType, src => src.GetOccupantType())
                .Map(dest => dest.OccupantName, src => src.OccupantName)
                .Map(dest => dest.FloorCount, src => src.BuildingFloorCount)
                .Map(dest => dest.Tenancy, src => src.BuildingTenancy)
                .Map(dest => dest.TransferLeaseOnSale, src => src.TransferLeaseOnSale)
                .Map(dest => dest.LeaseExpiry, src => src.LeaseExpiry)
                .Map(dest => dest.RentableArea, src => src.RentableArea);


            config.NewConfig<Entity.Views.Property, Model.PropertyModel>()
                .Map(dest => dest.PropertyTypeId, src => src.PropertyTypeId)
                .Map(dest => dest.Id, src => src.Id)
                .Map(dest => dest.RowVersion, src => src.RowVersion == null ? null : Convert.ToBase64String(src.RowVersion))
                .Map(dest => dest.PID, src => src.ParcelIdentity)
                .Map(dest => dest.PIN, src => src.PIN)
                .Map(dest => dest.ClassificationId, src => src.ClassificationId)
                .Map(dest => dest.Classification, src => src.Classification)
                .Map(dest => dest.Name, src => src.Name)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.Latitude, src => src.Location.Y)
                .Map(dest => dest.Longitude, src => src.Location.X)
                .Map(dest => dest.ProjectNumbers, src => JsonSerializer.Deserialize<IEnumerable<string>>(src.ProjectNumbers ?? "[]", _serializerOptions))
                .Map(dest => dest.IsSensitive, src => src.IsSensitive)

                .Map(dest => dest.AgencyId, src => src.AgencyId)
                .Map(dest => dest.Agency, src => src.Agency)
                .Map(dest => dest.AgencyCode, src => src.AgencyCode)
                .Map(dest => dest.SubAgency, src => src.SubAgency)
                .Map(dest => dest.SubAgencyCode, src => src.SubAgencyCode)

                .Map(dest => dest.AddressId, src => src.AddressId)
                .Map(dest => dest.Address, src => src.Address)
                .Map(dest => dest.AdministrativeArea, src => src.AdministrativeArea)
                .Map(dest => dest.Province, src => src.Province)
                .Map(dest => dest.Postal, src => src.Postal)

                .Map(dest => dest.Market, src => src.Market)
                .Map(dest => dest.MarketFiscalYear, src => src.MarketFiscalYear)
                .Map(dest => dest.NetBook, src => src.NetBook)
                .Map(dest => dest.NetBookFiscalYear, src => src.NetBookFiscalYear)
                .Map(dest => dest.Assessed, src => src.Assessed)
                .Map(dest => dest.AssessedDate, src => src.AssessedDate)
                .Map(dest => dest.Appraised, src => src.Appraised)
                .Map(dest => dest.AppraisedDate, src => src.AppraisedDate)

                .Map(dest => dest.LandArea, src => src.LandArea)
                .Map(dest => dest.LandLegalDescription, src => src.LandLegalDescription)
                .Map(dest => dest.Zoning, src => src.Zoning)
                .Map(dest => dest.ZoningPotential, src => src.ZoningPotential)

                .Map(dest => dest.ParcelId, src => src.ParcelId)
                .Map(dest => dest.ConstructionTypeId, src => src.BuildingConstructionTypeId)
                .Map(dest => dest.ConstructionType, src => src.BuildingConstructionType)
                .Map(dest => dest.PredominateUseId, src => src.BuildingPredominateUseId)
                .Map(dest => dest.PredominateUse, src => src.BuildingPredominateUse)
                .Map(dest => dest.OccupantTypeId, src => src.BuildingOccupantTypeId)
                .Map(dest => dest.OccupantType, src => src.BuildingOccupantType)
                .Map(dest => dest.OccupantName, src => src.OccupantName)
                .Map(dest => dest.FloorCount, src => src.BuildingFloorCount)
                .Map(dest => dest.Tenancy, src => src.BuildingTenancy)
                .Map(dest => dest.TransferLeaseOnSale, src => src.TransferLeaseOnSale)
                .Map(dest => dest.LeaseExpiry, src => src.LeaseExpiry)
                .Map(dest => dest.RentableArea, src => src.RentableArea);

            config.NewConfig<Entity.Models.ProjectProperty, Model.PropertyModel>()
                .Map(dest => dest.PropertyTypeId, src => src.PropertyTypeId)
                .Map(dest => dest.Id, src => src.Id)
                .Map(dest => dest.PID, src => src.ParcelIdentity)
                .Map(dest => dest.PIN, src => src.PIN)
                .Map(dest => dest.ClassificationId, src => src.ClassificationId)
                .Map(dest => dest.Classification, src => src.Classification)
                .Map(dest => dest.Name, src => src.Name)
                .Map(dest => dest.Description, src => src.Description)
                .Map(dest => dest.Latitude, src => src.Location.Y)
                .Map(dest => dest.Longitude, src => src.Location.X)
                .Map(dest => dest.ProjectNumbers, src => JsonSerializer.Deserialize<IEnumerable<string>>(src.ProjectNumbers ?? "[]", _serializerOptions))
                .Map(dest => dest.ProjectStatus, src => src.ProjectStatus)
                .Map(dest => dest.IsSensitive, src => src.IsSensitive)

                .Map(dest => dest.AgencyId, src => src.AgencyId)
                .Map(dest => dest.Agency, src => src.Agency)
                .Map(dest => dest.AgencyCode, src => src.AgencyCode)
                .Map(dest => dest.SubAgency, src => src.SubAgency)
                .Map(dest => dest.SubAgencyCode, src => src.SubAgencyCode)

                .Map(dest => dest.AddressId, src => src.AddressId)
                .Map(dest => dest.Address, src => src.Address)
                .Map(dest => dest.AdministrativeArea, src => src.AdministrativeArea)
                .Map(dest => dest.Province, src => src.Province)
                .Map(dest => dest.Postal, src => src.Postal)

                .Map(dest => dest.Market, src => src.Market)
                .Map(dest => dest.MarketFiscalYear, src => src.MarketFiscalYear)
                .Map(dest => dest.NetBook, src => src.NetBook)
                .Map(dest => dest.NetBookFiscalYear, src => src.NetBookFiscalYear)
                .Map(dest => dest.Assessed, src => src.Assessed)
                .Map(dest => dest.AssessedDate, src => src.AssessedDate)
                .Map(dest => dest.Appraised, src => src.Appraised)
                .Map(dest => dest.AppraisedDate, src => src.AppraisedDate)

                .Map(dest => dest.LandArea, src => src.LandArea)
                .Map(dest => dest.LandLegalDescription, src => src.LandLegalDescription)
                .Map(dest => dest.Zoning, src => src.Zoning)
                .Map(dest => dest.ZoningPotential, src => src.ZoningPotential)

                .Map(dest => dest.ParcelId, src => src.ParcelId)
                .Map(dest => dest.ConstructionTypeId, src => src.BuildingConstructionTypeId)
                .Map(dest => dest.ConstructionType, src => src.BuildingConstructionType)
                .Map(dest => dest.PredominateUseId, src => src.BuildingPredominateUseId)
                .Map(dest => dest.PredominateUse, src => src.BuildingPredominateUse)
                .Map(dest => dest.OccupantTypeId, src => src.BuildingOccupantTypeId)
                .Map(dest => dest.OccupantType, src => src.BuildingOccupantType)
                .Map(dest => dest.OccupantName, src => src.OccupantName)
                .Map(dest => dest.FloorCount, src => src.BuildingFloorCount)
                .Map(dest => dest.Tenancy, src => src.BuildingTenancy)
                .Map(dest => dest.TransferLeaseOnSale, src => src.TransferLeaseOnSale)
                .Map(dest => dest.LeaseExpiry, src => src.LeaseExpiry)
                .Map(dest => dest.RentableArea, src => src.RentableArea);
        }
    }
}
