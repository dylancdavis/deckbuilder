(ns deckbuilder.game.run)

(defn add-energy [game] (update game :energy inc))

(defn generate-credits [game]
  (if (>= (:energy game) 2)
    (update (update game :energy dec) :credits inc)
    game))

(def deck-size 5)