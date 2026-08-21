from sklearn.metrics import accuracy_score, classification_report


def evaluate_model(name, model, X_train, y_train, X_test, y_test):
    model.fit(X_train, y_train)
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)

    print(f"\n=== {name} ===")
    print(f"Accuracy: {accuracy:.2%}")
    print(classification_report(y_test, predictions))

    return accuracy