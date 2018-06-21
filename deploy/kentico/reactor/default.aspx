<%@ Page Title="" Language="C#" MasterPageFile="/cmstemplates/wna/reactor.master" AutoEventWireup="true" CodeFile="default.aspx.cs" Inherits="CMS_CMSTemplates_WNA_Basket" %>

<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolderHead" Runat="Server"></asp:Content>
<asp:Content ID="Content2" ContentPlaceHolderID="plcMain" Runat="Server">
    <asp:Literal ID="debug" runat="server"></asp:Literal>
    <div class="col-md-12 col-xs-12 genericContent">
        <div id="reactor-page"></div>
        <!--<cms:CMSPagePlaceholder ID="plcZones" runat="server">
        <LayoutTemplate>
            <cms:CMSWebPartZone ID="zContentZone" ZoneTitle="Content zone" runat="Server"></cms:CMSWebPartZone>
        </LayoutTemplate>
        </cms:CMSPagePlaceholder> -->
    </div>

</asp:Content>
<asp:Content ID="Content3" ContentPlaceHolderID="ContentPlaceHolderScriptsFooter" Runat="Server">
    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAm3NlXEfs62enAhJrdfU5C3QlfuKWKOmo"></script>
    <script type="text/javascript">
        jQuery(document).ready(function ($) {
            reactordb.makeReactorPage({
                reactor_search_url: "http://reactordb.world-nuclear.org/query/reactor/_search",
                operation_search_url: "http://reactordb.world-nuclear.org/query/operation/_search",
                id_regex: new RegExp("default.aspx\/(.+)")
            });
        });
    </script>
</asp:Content>

