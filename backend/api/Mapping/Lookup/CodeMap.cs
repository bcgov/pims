using Mapster;
using Entity = Pims.Dal.Entities;

namespace Pims.Api.Mapping.Lookup
{
    public class CodeMap : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            config.NewConfig<Entity.Agency, Models.CodeModel<int>>()
                .IgnoreNonMapped(true)
                .Map(dest => dest.Code, src => src.Code)
                .Inherits<Entity.LookupEntity<int>, Models.LookupModel<int>>();

            config.NewConfig<Entity.City, Models.CodeModel<int>>()
                .IgnoreNonMapped(true)
                .Map(dest => dest.Code, src => src.Code)
                .Inherits<Entity.LookupEntity<int>, Models.LookupModel<int>>();
        }
    }
}
