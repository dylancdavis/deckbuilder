(ns deckbuilder.game.run)

(defn add-points [game] (update game :points inc))