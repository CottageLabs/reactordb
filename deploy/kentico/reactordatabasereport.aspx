<%@ Page Title="" Language="C#" MasterPageFile="reactor.master" AutoEventWireup="true" CodeFile="reactordatabase.aspx.cs" Inherits="CMS_CMSTemplates_WNA_Basket" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolderHead" Runat="Server">
</asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="plcMain" Runat="Server">
    <div class="col-md-12 col-xs-12 genericContent">
        <div id="generic-report"></div>
    <cms:CMSPagePlaceholder ID="plcZones" runat="server">
    <LayoutTemplate>
        <cms:CMSWebPartZone ID="zContentZone" ZoneTitle="Content zone" runat="Server"></cms:CMSWebPartZone>
    </LayoutTemplate>
    </cms:CMSPagePlaceholder> 
    </div>
</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="ContentPlaceHolderScriptsFooter" Runat="Server">
        <script type="text/javascript">
            jQuery(document).ready(function($) {
                var year = 2017;
                reactordb.makeGenericReport({
                    year: year,
                    reactor_search_url: "http://reactordb.world-nuclear.org/query/reactor/_search",
                    operation_search_url: "http://reactordb.world-nuclear.org/custom/operation/_search?year=" + year,
                    reactorPageURLTemplate: "/reactor/{reactor_name}",
                    countryPageURLTemplate: "/country/{country_name}",
                    searchPageURLTemplate: "/search?source={query}",
                    reactorsBackground: "http://world-nuclear.org/WNA/media/WNA/Furniture/General/iconReactor.svg",
                    underConstructionBackground: "http://world-nuclear.org/WNA/media/WNA/Furniture/General/iconConstruction.svg",
                    shutdownBackground: "http://world-nuclear.org/WNA/media/WNA/Furniture/General/iconShutdown.svg"
                });
            });
        </script>
</asp:Content>

