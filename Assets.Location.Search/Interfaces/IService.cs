using System;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Assets.Location.Search.Interfaces
{
    public interface IService<T>
    {
        Task<T> GetData (string endpointUrl, NameValueCollection requestParameters, string specialParameter, bool isQuerystring = false);
        Task<T> GetData (string endpointUrl, NameValueCollection requestParameters, bool isQuerystring = false);
        Task<T> GetData (string endpointUrl);
        Task<T> GetData ();
    }
}
