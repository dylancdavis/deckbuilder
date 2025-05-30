(ns deckbuilder.views.main
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.views.run :as run-panel]
   [deckbuilder.views.collection :as collection-view]))

(defn get-view [name]
  (case name
    [:collection] collection-view/collection-view
    [:run] run-panel/run-view))

(def nav-divider [:div.nav-divider])

(defn app []
  (let [view @(re-frame/subscribe [::subs/view])]
    [:div.app
     [:h1.game-title "Deckbuilder"]
     [:div.main-content
      [:div.main-panel
       [:div.nav "Collection" nav-divider "Current Run"]
       ((get-view view))]]]))