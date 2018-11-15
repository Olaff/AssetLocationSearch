using Assets.Location.Search.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections.Specialized;
using System.Net;
using System.Text;
using Newtonsoft.Json;
using System.Threading.Tasks;
using System.Net.Http;

namespace Assets.Location.Search.Services
{
    public class GeoLocationService<T>: IService<T> where T: new()
    {
        public string EndpointUrl { get; set; }

        public GeoLocationService ()
        {

        }

        public GeoLocationService (string endpointUrl)
        {
            this.EndpointUrl = endpointUrl ?? string.Empty;
        }

        public async Task<T> GetData (string endpointUrl, NameValueCollection requestParameters, string specialParameter, bool isQuerystring = false)
        {
            string jsonResponse = string.Empty;
            using ( WebClient client = new WebClient() )
            {
                client.Encoding = Encoding.UTF8;

                if ( requestParameters != null && requestParameters.Count > 0 )
                {
                    if ( isQuerystring )
                    {
                        client.QueryString.Add(requestParameters);
                    }
                    else
                    {
                        client.Headers.Add(requestParameters);
                    }
                }

                var parametrizedUrl = String.Format(endpointUrl, specialParameter);
                jsonResponse = await client.DownloadStringTaskAsync(parametrizedUrl);
            }

            return JsonConvert.DeserializeObject<T>(jsonResponse);
        }

        public async Task<T> GetData (string endpointUrl, NameValueCollection requestParameters, bool isQuerystring = false)
        {
            string jsonResponse = string.Empty;
            using ( WebClient client = new WebClient() )
            {
                client.Encoding = Encoding.UTF8;

                if ( requestParameters != null && requestParameters.Count > 0 )
                {
                    if ( isQuerystring )
                    {
                        client.QueryString.Add(requestParameters);
                    }
                    else
                    {
                        client.Headers.Add(requestParameters);
                    }
                }

                jsonResponse = await client.DownloadStringTaskAsync(endpointUrl);
            }

            return JsonConvert.DeserializeObject<T>(jsonResponse);
        }

        public async Task<T> GetData (string endpointUrl)
        {
            string jsonResponse = string.Empty;

            using ( WebClient client = new WebClient() )
            {
                client.Encoding = Encoding.UTF8;
                jsonResponse = await client.DownloadStringTaskAsync(endpointUrl);
            }

            return JsonConvert.DeserializeObject<T>(jsonResponse);
        }

        public async Task<T> GetData ()
        {
            return await this.GetData(this.EndpointUrl);
        }


    }
}