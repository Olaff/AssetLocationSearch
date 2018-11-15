/*Javascripts equivalent to C#'s String.Format*/
String.format = function (stringToFormat) {
    var args = arguments;
    return stringToFormat.replace(/(\{\{\d\}\}|\{\d\})/g, function (stringToFormat) {
        if (stringToFormat.substring(0, 2) == "{{") return stringToFormat;
        var index = parseInt(stringToFormat.match(/\d/)[0]);
        return args[index + 1];
    });
};

//Returns true if value is on string
String.contains = function (string, lookupValue) {
    return !!~string.indexOf(lookupValue);
}

String.capitalize = function(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

///Round extension method to floats
Number.round = function (theNumber, decimalPlaces) {
    var result;

    if (theNumber) {
        var coeficient = Math.pow(10, decimalPlaces);
        result = Math.round(theNumber * coeficient) / coeficient;
    }
    return result;
}

//Check if user agent is any version of IE
function isIEVersion() {
    var userAgent = window.navigator.userAgent;
    var isIE = (String.contains(userAgent, "Trident/7.0")) || (String.contains(userAgent, "Trident/6.0")) || (String.contains(userAgent, "Trident/5.0")) ||
               (String.contains(userAgent, "Edge/"));

    return isIE;
}