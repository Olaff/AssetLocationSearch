using Assets.Location.Search.Interfaces;
using Assets.Location.Search.Models;
using Assets.Location.Search.Extensions;
using Sitecore.Data;
using Sitecore.Data.Items;
using Sitecore.SecurityModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Assets.Location.Search.Services
{
    public class LocationService
    {
        private int AmountOfItems { get; set; }
        public LocationService ()
        {

        }

        public LocationService (int? amountOfItems)
        {
            this.AmountOfItems = amountOfItems.HasValue ? amountOfItems.Value : default(int);
        }

        public IServiceResponse CreateLocationItems(GeocodeResponse geocodeResponse)
        {
            LocationServiceResponse response = new LocationServiceResponse();

            using ( new BulkUpdateContext() )
            {
                using ( new SecurityDisabler() )
                {
                    Database masterDB = Sitecore.Configuration.Factory.GetDatabase("master");
                    Item folderItem = masterDB.GetItem("/sitecore/content/Data Repository/Locations");
                    TemplateItem locationItemTemplate = masterDB.GetTemplate("{4D641639-9633-4E9A-AB4A-549B269EC3AC}");

                    if ( folderItem != null && locationItemTemplate != null )
                    {
                        var watch = System.Diagnostics.Stopwatch.StartNew();
                        Random rng = new Random();

                        for ( int i = 1; i <= AmountOfItems; i++ )
                        {
                            double latitudeCoefficient = rng.NextDouble(0, 1);
                            double longitudeCoefficient = rng.NextDouble(0, 1);

                            Item newItem = folderItem.Add(String.Format("Location Item {0} {1}", geocodeResponse.City, i), locationItemTemplate);
                            newItem.Editing.BeginEdit();
                            newItem.Fields["Code"].Value = rng.Next(1000, 9999).ToString();
                            newItem.Fields["Address"].Value = String.Format("Address Test {0}", i);
                            newItem.Fields["Postal Code"].Value = geocodeResponse.ZipCode;
                            newItem.Fields["Phone Number"].Value = "1234567890";
                            newItem.Fields["City"].Value = geocodeResponse.City;
                            newItem.Fields["State Province"].Value = geocodeResponse.RegionName;
                            newItem.Fields["Country"].Value = geocodeResponse.CountryName;
                            newItem.Fields["Latitude"].Value = (geocodeResponse.Latitude + latitudeCoefficient).ToString();
                            newItem.Fields["Longitude"].Value = (geocodeResponse.Longitude + longitudeCoefficient).ToString();
                            newItem.Editing.AcceptChanges();
                        }

                        watch.Stop();

                        response.Success = true;
                        response.Message = String.Format("{0} Locations were created successfully in {1} seconds", AmountOfItems, watch.Elapsed.TotalSeconds);
                    }
                    else
                    {
                        response.Success = false;
                        response.Message = String.Format("Folder Item or Template cannot be found in Sitecore");
                    }
                }
            }

            return response;
        }
    }
}