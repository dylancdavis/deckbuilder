(ns test.utilities.counter-test
  (:require [cljs.test :refer [deftest testing is]]
            [deckbuilder.utilities.counter :refer [add sub merge-counters]]))

(deftest counter 
  (testing "Counter"
    (testing "adds correctly"
      (is (= (add {} :a) {:a 1}) "Adding to empty counter")
      (is (= (add {:a 1} :a) {:a 2}) "Adding to existing key")
      (is (= (add {:a 1} :b) {:a 1 :b 1})) "Adding new key to existing counter")
    (testing "subtracts correctly"
      (is (= (sub {:a 1} :a) {}) "Subtracting to zero doesn't yield empty counter")
      (is (= (sub {:a 2} :a) {:a 1}) "Subtracting from existing key")
      (is (= (sub {:a 2} :b) {:a 2}) "Subtracting non-existing key")
      (is (= (sub {:a 2} :a 3) {}) "Subtracting more than available")
      (testing "merges correctly"
        (is (= (merge-counters {:a 1} {:b 2}) {:a 1 :b 2}) "Merging two counters")
        (is (= (merge-counters {:a 1} {:a 2}) {:a 3}))))) "Merging two counters with same key")