using Assets.Location.Search.Configuration;
using Assets.Location.Search.Helpers;
using System;

namespace Assets.Location.Search.Models
{
    public class CustomCoveoSearchModel : Coveo.UI.Mvc.Models.SearchModel
    {
        #region Properties

        /// <summary>
        /// Nested class to handle objects that represents a Coveo Indexed Field
        /// </summary>
        public class CoveoCustomField
        {
            /// <summary>
            /// It has the name of the field with @ prefix appended to it
            /// </summary>
            public string PrefixedName { get; set; }
            public string FieldName { get; set; }

            public CoveoCustomField (Func<string, bool, string> action, string fieldName)
            {
                this.PrefixedName = action.Invoke(fieldName, true);
                this.FieldName = action.Invoke(fieldName, false);
            }
        }

        public string CurrentItemName { get; set; }
        public Sitecore.Globalization.Language CurrentLanguage { get; set; }
        public string CurrentLanguageRegion { get; set; }
        public string CurrentItemUrl { get; set; }
        public string SkipGoogleValues { get; set; }
        public bool IsGeneralSearch { get; set; }
        public bool IsCustomPage { get; set; }
        public bool IsCityStatePage { get; set; }
        public double DistanceUnit { get; set; }
        public string GoogleMapsApiKey { get; set; }
        public CoveoCustomField Name { get; set; }
        public CoveoCustomField Latitude { get; set; }
        public CoveoCustomField Longitude { get; set; }
        public CoveoCustomField Address { get; set; }
        public CoveoCustomField PhoneNumber { get; set; }
        public CoveoCustomField ZipCode { get; set; }
        public CoveoCustomField City { get; set; }
        public CoveoCustomField StateProvince { get; set; }
        public CoveoCustomField Code { get; set; }
        public CoveoCustomField TemplateName { get; set; }
        public GeoIpData CurrentUserLocation { get; set; }
        public string IsDefaultGeoIp { get; set; }

        #endregion

        #region Constructors

        public CustomCoveoSearchModel ()
        {
            Initialize(Sitecore.Mvc.Presentation.RenderingContext.Current.Rendering);
            this.CurrentItemName = Sitecore.Context.Item.Name;
            this.CurrentLanguage = Sitecore.Context.Language;
            this.CurrentLanguageRegion = Sitecore.Context.Language.CultureInfo.Name;
            this.CurrentItemUrl = GetItemUrl();
            this.SkipGoogleValues = GetRenderingParameter("Skip Google Search");
            this.DistanceUnit = GetDistanceUnit("Distance Unit");
            this.GoogleMapsApiKey = ServiceConfig.GoogleMapsApiKey;
            this.Name = new CoveoCustomField(this.ToCoveoFieldName, "Name");
            this.Latitude = new CoveoCustomField(this.ToCoveoFieldName, "latitude");
            this.Longitude = new CoveoCustomField(this.ToCoveoFieldName, "longitude");
            this.Address = new CoveoCustomField(this.ToCoveoFieldName, "Address");
            this.PhoneNumber = new CoveoCustomField(this.ToCoveoFieldName, "Phone Number");
            this.ZipCode = new CoveoCustomField(this.ToCoveoFieldName, "Postal Code");
            this.City = new CoveoCustomField(this.ToCoveoFieldName, "City");
            this.StateProvince = new CoveoCustomField(this.ToCoveoFieldName, "State Province");
            this.Code = new CoveoCustomField(this.ToCoveoFieldName, "Code");
            this.TemplateName = new CoveoCustomField(this.ToCoveoFieldName, "_templatename");
            this.CurrentUserLocation = GeoIpHelper.GetCurrentLocation();
            this.IsDefaultGeoIp = this.CurrentUserLocation.IsDefault.ToString().ToLowerInvariant() ?? string.Empty;
            //var publicNameField = Model.ToCoveoFieldName("dynamicLocationName");
            //string locationTypeField = Model.ToCoveoFieldName("business type");
            //string specialFuneralServicesField = Model.ToCoveoFieldName("funeral culture");
            //string specificLocationFeatures = Model.ToCoveoFieldName("features");
        }


        #endregion

        #region Methods


        public bool IsCanadianOrFrench()
        {
            return (this.CurrentLanguageRegion.Equals("en-ca", StringComparison.InvariantCultureIgnoreCase) || this.CurrentLanguageRegion.Equals("fr-ca", StringComparison.InvariantCultureIgnoreCase));
        }

        private string GetRenderingParameter (string renderingParameterName)
        {
            string renderingParameterValue = string.Empty;

            if ( Sitecore.Mvc.Presentation.RenderingContext.Current != null && !String.IsNullOrEmpty(renderingParameterName) )
            {
                renderingParameterValue = Sitecore.Mvc.Presentation.RenderingContext.Current.Rendering.Parameters[renderingParameterName] ?? string.Empty;
            }

            return renderingParameterValue;
        }

        private double GetDistanceUnit (string renderingParameterName)
        {
            var renderingParameterValue = this.GetRenderingParameter(renderingParameterName);
            return !String.IsNullOrEmpty(renderingParameterValue) ? Convert.ToDouble(renderingParameterValue) : default(double);
        }

        private string GetItemUrl ()
        {
            var urlOptions = new Sitecore.Links.UrlOptions();
            urlOptions.AlwaysIncludeServerUrl = true;
            return Sitecore.Links.LinkManager.GetItemUrl(Sitecore.Context.Item, urlOptions);
        }

        #endregion
    }
}