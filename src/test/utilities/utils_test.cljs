(ns test.utilities.utils-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.utilities.utils :refer [first-missing-num]]))

(deftest first-missing-num-test
  (is (= (first-missing-num []) 1))
  (is (= (first-missing-num [1 2 3]) 4))
  (is (= (first-missing-num [1 3 4]) 2))
  (is (= (first-missing-num [1 2 3 5 7]) 4))
  (is (= (first-missing-num [2 3 5]) 1)))