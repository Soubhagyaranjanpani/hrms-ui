import { useState, useEffect } from "react";
import {
  FaSearch,
  FaEdit,
  FaArrowLeft,
  FaSave,
  FaExclamationCircle,
  FaUserPlus,
  FaTimes,
} from "react-icons/fa";
import { toast } from "../components/Toast";
import { STORAGE_KEYS } from "../config/api.config";

const RULES = {
  cityName: {
    required: true,
    minLen: 2,
    maxLen: 50,
    pattern: /^[a-zA-Z\s]+$/,
    patternMsg: "Only letters and spaces allowed",
  },

  cityCode: {
    required: true,
    minLen: 2,
    maxLen: 5,
    pattern: /^[A-Z]+$/,
    patternMsg: "Only uppercase letters allowed",
  },
};

const validate = (field, value) => {
  const r = RULES[field];

  if (!r) return "";

  const v =
    typeof value === "string"
      ? value.trim()
      : String(value ?? "").trim();

  if (r.required && !v) {
    return "This field is required";
  }

  if (!v && !r.required) {
    return "";
  }

  if (r.minLen && v.length < r.minLen) {
    return `Minimum ${r.minLen} characters`;
  }

  if (r.maxLen && v.length > r.maxLen) {
    return `Maximum ${r.maxLen} characters`;
  }

  if (r.pattern && !r.pattern.test(v)) {
    return r.patternMsg;
  }

  return "";
};

const FieldError = ({ msg }) =>
  msg ? (
    <span className="field-err">
      <FaExclamationCircle size={10} /> {msg}
    </span>
  ) : null;

/*
 * State dropdown
 * Keep this list as it was in your original City page.
 */
const STATES = [
  { id: 1, name: "Maharashtra", code: "MH" },
  { id: 2, name: "Gujarat", code: "GJ" },
  { id: 3, name: "Rajasthan", code: "RJ" },
  { id: 4, name: "California", code: "CA" },
  { id: 5, name: "Texas", code: "TX" },
  { id: 6, name: "New York", code: "NY" },
  { id: 7, name: "London", code: "LD" },
  { id: 8, name: "Manchester", code: "MN" },
  { id: 9, name: "New South Wales", code: "NSW" },
  { id: 10, name: "Queensland", code: "QLD" },
];

const API_BASE_URL =
  "http://localhost:8080/hrms/api/recuirment";

const City = () => {
  const [view, setView] = useState("list");
  const [editMode, setEditMode] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);

  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  const [searchName, setSearchName] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedStateFilter, setSelectedStateFilter] =
    useState("");

  const [showStatusModal, setShowStatusModal] =
    useState(false);

  const [statusAction, setStatusAction] = useState({
    id: null,
    newStatus: null,
    name: "",
  });

  const [formData, setFormData] = useState({
    cityName: "",
    cityCode: "",
    stateId: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  /*
   * =====================================================
   * SEARCH DEBOUNCE
   * =====================================================
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchName);
      setPage(0);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchName]);

  /*
   * =====================================================
   * GET ALL CITY API
   *
   * GET
   * /hrms/api/recuirment/getAllCity
   * =====================================================
   */
  const getAuthToken = () => localStorage.getItem(STORAGE_KEYS.JWT_TOKEN);

  const getAllCities = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/getAllCity`,
        {
          method: "GET",
          headers: {
                  Authorization: `Bearer ${getAuthToken()}`,

            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load cities: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "GET ALL CITY RESPONSE:",
        data
      );

      /*
       * Your backend may return:
       *
       * [
       *   {...}
       * ]
       *
       * OR
       *
       * {
       *   response: [...]
       * }
       *
       * OR
       *
       * {
       *   data: [...]
       * }
       */

      const cityList = Array.isArray(data)
        ? data
        : data.response ||
          data.data ||
          [];

      setCities(cityList);
      setPage(0);
    } catch (error) {
      console.error(
        "Get all city error:",
        error
      );

      toast.warning(
        "Error",
        "Unable to load city data"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * GET CITY BY STATE
   *
   * GET
   * /hrms/api/recuirment/getCityByStateId/{stateId}
   *
   * This is used when State filter is changed.
   * =====================================================
   */

  const getCitiesByState = async (stateId) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/getCityByStateId/${stateId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load cities by state: ${response.status}`
        );
      }

      const data = await response.json();

      console.log(
        "GET CITY BY STATE RESPONSE:",
        data
      );

      const cityList = Array.isArray(data)
        ? data
        : data.response ||
          data.data ||
          [];

      setCities(cityList);
      setPage(0);
    } catch (error) {
      console.error(
        "Get city by state error:",
        error
      );

      toast.warning(
        "Error",
        "Unable to load cities for selected state"
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * LOAD CITY DATA WHEN PAGE OPENS
   * =====================================================
   */

  useEffect(() => {
    getAllCities();
  }, []);

  /*
   * =====================================================
   * STATE FILTER
   * =====================================================
   */

  const handleStateFilterChange = async (
    stateId
  ) => {
    setSelectedStateFilter(stateId);

    if (!stateId) {
      await getAllCities();
      return;
    }

    await getCitiesByState(stateId);
  };

  /*
   * =====================================================
   * FORM CHANGE
   * =====================================================
   */

  const handleChange = (
    field,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "cityName") {
      setErrors((prev) => ({
        ...prev,
        cityName: validate(
          "cityName",
          value
        ),
      }));
    }

    if (field === "cityCode") {
      setErrors((prev) => ({
        ...prev,
        cityCode: validate(
          "cityCode",
          value
        ),
      }));
    }

    if (field === "stateId") {
      setErrors((prev) => ({
        ...prev,
        stateId: value
          ? ""
          : "Please select a state",
      }));
    }
  };

  /*
   * =====================================================
   * FIELD BLUR
   * =====================================================
   */

  const handleBlur = (field) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));

    if (
      field === "cityName" ||
      field === "cityCode"
    ) {
      setErrors((prev) => ({
        ...prev,
        [field]: validate(
          field,
          formData[field]
        ),
      }));
    }

    if (field === "stateId") {
      setErrors((prev) => ({
        ...prev,
        stateId: formData.stateId
          ? ""
          : "Please select a state",
      }));
    }
  };

  /*
   * =====================================================
   * RESET FORM
   * =====================================================
   */

  const resetForm = () => {
    setFormData({
      cityName: "",
      cityCode: "",
      stateId: "",
    });

    setErrors({});
    setTouched({});
    setSelectedCity(null);
    setEditMode(false);
    setSubmitting(false);
  };

  /*
   * =====================================================
   * SAVE / UPDATE CITY
   *
   * POST
   * /hrms/api/recuirment/saveCity
   *
   * PUT
   * /hrms/api/recuirment/updateCityById/{id}
   * =====================================================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errName = validate(
      "cityName",
      formData.cityName
    );

    const errCode = validate(
      "cityCode",
      formData.cityCode
    );

    setTouched({
      cityName: true,
      cityCode: true,
      stateId: true,
    });

    setErrors({
      cityName: errName,
      cityCode: errCode,
      stateId: formData.stateId
        ? ""
        : "Please select a state",
    });

    if (!formData.stateId) {
      toast.warning(
        "Validation Error",
        "Please select a state"
      );

      return;
    }

    if (errName || errCode) {
      toast.warning(
        "Validation Error",
        "Please fix the highlighted fields"
      );

      return;
    }

    try {
      setSubmitting(true);

      /*
       * Request body expected by backend
       */
      const requestBody = {
        cityCode:
          formData.cityCode
            .trim()
            .toUpperCase(),

        cityName:
          formData.cityName.trim(),

        status: editMode
          ? String(
              selectedCity?.status || "Y"
            ).toUpperCase()
          : "Y",

        stateId:
          Number(formData.stateId),
      };

      console.log(
        "CITY REQUEST BODY:",
        requestBody
      );

      /*
       * =========================
       * UPDATE CITY
       * =========================
       */

      if (editMode) {
        const response = await fetch(
          `${API_BASE_URL}/updateCityById/${selectedCity.id}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(
              requestBody
            ),
          }
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "Update error:",
            errorText
          );

          throw new Error(
            `Update failed: ${response.status}`
          );
        }

        const data = await response.text();

        console.log(
          "UPDATE CITY RESPONSE:",
          data
        );

        toast.success(
          "Success",
          "City updated successfully"
        );
      }

      /*
       * =========================
       * SAVE CITY
       * =========================
       */

      else {
        const response = await fetch(
          `${API_BASE_URL}/saveCity`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getAuthToken()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(
              requestBody
            ),
          }
        );

        if (!response.ok) {
          const errorText =
            await response.text();

          console.error(
            "Save error:",
            errorText
          );

          throw new Error(
            `Save failed: ${response.status}`
          );
        }

        const data = await response.text();

        console.log(
          "SAVE CITY RESPONSE:",
          data
        );

        toast.success(
          "Success",
          "City created successfully"
        );
      }

      /*
       * Refresh table after save/update
       */
      await getAllCities();

      resetForm();
      setView("list");
    } catch (error) {
      console.error(
        "Save/Update city error:",
        error
      );

      toast.warning(
        "Error",
        error.message ||
          "Unable to save city"
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * =====================================================
   * EDIT CITY
   * =====================================================
   */

  const handleEdit = (city) => {
    const status = String(
      city.status || ""
    ).toLowerCase();

    if (status !== "y") {
      toast.warning(
        "Inactive",
        "Cannot edit an inactive city"
      );

      return;
    }

    setFormData({
      cityName:
        city.cityName || "",

      cityCode:
        city.cityCode || "",

      stateId: city.stateId
        ? String(city.stateId)
        : "",
    });

    setSelectedCity(city);
    setEditMode(true);
    setView("form");
  };

  /*
   * =====================================================
   * STATUS TOGGLE
   *
   * There is no status API provided,
   * so this only changes local UI state.
   * =====================================================
   */

  const handleStatusToggle = (
    id,
    currentStatus,
    name
  ) => {
    const normalizedStatus =
      String(
        currentStatus || ""
      ).toLowerCase();

    const newStatus =
      normalizedStatus === "y"
        ? "n"
        : "y";

    setStatusAction({
      id,
      newStatus,
      name,
    });

    setShowStatusModal(true);
  };

  /*
   * =====================================================
   * CONFIRM STATUS CHANGE
   * =====================================================
   */

  const confirmStatusChange =
    async () => {
      const {
        id,
        newStatus,
        name,
      } = statusAction;

      setCities((prev) =>
        prev.map((city) =>
          city.id === id
            ? {
                ...city,
                status: newStatus,
              }
            : city
        )
      );

      toast.success(
        "Status Updated",
        `${name} status changed`
      );

      setShowStatusModal(false);

      setStatusAction({
        id: null,
        newStatus: null,
        name: "",
      });
    };

  /*
   * =====================================================
   * FILTER SEARCH
   * =====================================================
   */

  const filteredCities =
    cities.filter((city) => {
      const search =
        debouncedSearch
          .trim()
          .toLowerCase();

      if (!search) {
        return true;
      }

      const cityName = String(
        city.cityName || ""
      ).toLowerCase();

      const cityCode = String(
        city.cityCode || ""
      ).toLowerCase();

      const stateName = String(
        city.stateName || ""
      ).toLowerCase();

      return (
        cityName.includes(search) ||
        cityCode.includes(search) ||
        stateName.includes(search)
      );
    });

  /*
   * =====================================================
   * PAGINATION
   * =====================================================
   */

  const totalItems =
    filteredCities.length;

  const totalPages = Math.ceil(
    totalItems / rowsPerPage
  );

  const startIndex =
    page * rowsPerPage;

  const currentCities =
    filteredCities.slice(
      startIndex,
      startIndex + rowsPerPage
    );

  /*
   * If search/filter reduces page count,
   * keep page within valid range.
   */

  useEffect(() => {
    if (
      totalPages > 0 &&
      page >= totalPages
    ) {
      setPage(totalPages - 1);
    }
  }, [page, totalPages]);

  /*
   * =====================================================
   * PAGINATION RANGE
   * =====================================================
   */

  const getPaginationRange = () => {
    const pages = [];

    if (totalPages <= 5) {
      for (
        let i = 0;
        i < totalPages;
        i++
      ) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(0);

    if (page > 2) {
      pages.push("...");
    }

    const start = Math.max(
      1,
      page - 1
    );

    const end = Math.min(
      totalPages - 2,
      page + 1
    );

    for (
      let i = start;
      i <= end;
      i++
    ) {
      pages.push(i);
    }

    if (page < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages - 1);

    return pages;
  };

  /*
   * =====================================================
   * FIELD UI HELPERS
   * =====================================================
   */

  const isFieldErr = (field) => {
    return Boolean(
      touched[field] &&
        errors[field]
    );
  };

  const isFieldOk = (field) => {
    if (field === "stateId") {
      return Boolean(
        touched[field] &&
          formData[field] &&
          !errors[field]
      );
    }

    return Boolean(
      touched[field] &&
        formData[field] &&
        !errors[field]
    );
  };

  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <>
      <div className="emp-root">

        <div
          className="emp-header"
          style={
            view === "form"
              ? {
                  justifyContent:
                    "space-between",
                }
              : {}
          }
        >
          {view === "form" ? (
            <>
              <div>
                <h1 className="emp-title">
                  {editMode
                    ? "Edit City"
                    : "Add City"}
                </h1>

                <p className="emp-subtitle">
                  {editMode
                    ? "Update city information"
                    : "Enter new city details"}
                </p>
              </div>

              <button
                className="emp-back-btn"
                onClick={() => {
                  resetForm();
                  setView("list");
                }}
              >
                <FaArrowLeft size={12} />{" "}
                Back
              </button>
            </>
          ) : (
            <>
              <div className="emp-header-left">
                <div>
                  <h1 className="emp-title">
                    City Directory
                  </h1>

                  <p className="emp-subtitle">
                    {totalItems} total cities
                  </p>
                </div>
              </div>

              <button
                className="emp-add-btn"
                onClick={() => {
                  resetForm();
                  setView("form");
                }}
              >
                <FaUserPlus size={13} />{" "}
                Add City
              </button>
            </>
          )}
        </div>

        {view === "list" ? (
          <>
            <div className="emp-search-bar">
              <div className="emp-search-wrap">
                <FaSearch
                  className="emp-search-icon"
                  size={12}
                />

                <input
                  className="emp-search-input"
                  type="text"
                  placeholder="Search by city name, code or state…"
                  value={searchName}
                  onChange={(e) =>
                    setSearchName(
                      e.target.value
                    )
                  }
                />

                {searchName && (
                  <button
                    className="emp-search-clear"
                    onClick={() =>
                      setSearchName("")
                    }
                  >
                    <FaTimes size={11} />
                  </button>
                )}
              </div>

              <div
                style={{
                  marginLeft: "10px",
                  minWidth: "220px",
                }}
              >
                <select
                  value={
                    selectedStateFilter
                  }
                  onChange={(e) =>
                    handleStateFilterChange(
                      e.target.value
                    )
                  }
                  style={{
                    width: "100%",
                    padding:
                      "8px 10px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius:
                      "6px",
                    fontSize: "13px",
                    backgroundColor:
                      "#fff",
                  }}
                >
                  <option value="">
                    All States
                  </option>

                  {STATES.map(
                    (state) => (
                      <option
                        key={
                          state.id
                        }
                        value={
                          state.id
                        }
                      >
                        {state.name} (
                        {state.code})
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="emp-table-card">
              <div className="emp-table-wrap">
                <table className="emp-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>
                        #
                      </th>

                      <th>
                        City Code
                      </th>

                      <th>
                        City Name
                      </th>

                      <th>
                        State
                      </th>

                      <th
                        style={{
                          width: 80,
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          width: 100,
                          textAlign:
                            "center",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan="6"
                          className="emp-empty"
                        >
                          <div className="emp-empty-inner">
                            <p>
                              Loading cities...
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : currentCities.length >
                      0 ? (
                      currentCities.map(
                        (
                          city,
                          idx
                        ) => {
                          const normalizedStatus =
                            String(
                              city.status ||
                                ""
                            ).toLowerCase();

                          return (
                            <tr
                              key={
                                city.id
                              }
                              className="emp-row"
                            >
                              <td className="emp-sno">
                                {startIndex +
                                  idx +
                                  1}
                              </td>

                              <td>
                                {city.cityCode ||
                                  "—"}
                              </td>

                              <td>
                                <div className="emp-name">
                                  {city.cityName ||
                                    "—"}
                                </div>
                              </td>

                              <td>
                                {
                                  city.stateName
                                }
                              </td>

                              <td>
                                <div
                                  onClick={() =>
                                    handleStatusToggle(
                                      city.id,
                                      city.status,
                                      city.cityName
                                    )
                                  }
                                  style={{
                                    display:
                                      "flex",
                                    alignItems:
                                      "center",
                                    gap: "6px",
                                    cursor:
                                      "pointer",
                                  }}
                                >
                                  <div
                                    style={{
                                      width:
                                        "28px",
                                      height:
                                        "16px",
                                      borderRadius:
                                        "50px",
                                      backgroundColor:
                                        normalizedStatus ===
                                        "y"
                                          ? "var(--accent-indigo)"
                                          : "var(--border-medium)",
                                      position:
                                        "relative",
                                      transition:
                                        "0.2s",
                                    }}
                                  >
                                    <div
                                      style={{
                                        width:
                                          "12px",
                                        height:
                                          "12px",
                                        borderRadius:
                                          "50%",
                                        backgroundColor:
                                          "white",
                                        position:
                                          "absolute",
                                        top: "2px",
                                        left:
                                          normalizedStatus ===
                                          "y"
                                            ? "14px"
                                            : "2px",
                                        transition:
                                          "0.2s",
                                        boxShadow:
                                          "0 1px 2px rgba(0,0,0,0.2)",
                                      }}
                                    />
                                  </div>

                                  <span
                                    style={{
                                      fontSize:
                                        "11px",
                                      fontWeight:
                                        "500",
                                      color:
                                        normalizedStatus ===
                                        "y"
                                          ? "var(--accent-indigo)"
                                          : "var(--text-muted)",
                                    }}
                                  >
                                    {normalizedStatus ===
                                    "y"
                                      ? "Active"
                                      : "Inactive"}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <div
                                  className="emp-actions"
                                  style={{
                                    display:
                                      "flex",
                                    gap: "4px",
                                    justifyContent:
                                      "center",
                                  }}
                                >
                                  <button
                                    className="emp-act emp-act--edit"
                                    onClick={() =>
                                      handleEdit(
                                        city
                                      )
                                    }
                                    title={
                                      normalizedStatus !==
                                      "y"
                                        ? "Cannot edit inactive city"
                                        : "Edit"
                                    }
                                    style={{
                                      opacity:
                                        normalizedStatus !==
                                        "y"
                                          ? 0.5
                                          : 1,
                                    }}
                                    disabled={
                                      normalizedStatus !==
                                      "y"
                                    }
                                  >
                                    <FaEdit
                                      size={12}
                                    />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan="6"
                          className="emp-empty"
                        >
                          <div className="emp-empty-inner">
                            <span className="emp-empty-icon">
                              🏙️
                            </span>

                            <p>
                              No cities found
                            </p>

                            <small>
                              Try a different
                              search or state
                            </small>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalItems > 0 && (
                <div
                  className="emp-pagination"
                  style={{
                    justifyContent:
                      "space-between",
                    flexWrap:
                      "wrap",
                  }}
                >
                  <div
                    style={{
                      display:
                        "flex",
                      alignItems:
                        "center",
                      gap: "12px",
                    }}
                  >
                    <span className="emp-page-info">
                      Showing{" "}
                      {startIndex + 1}
                      –
                      {Math.min(
                        startIndex +
                          rowsPerPage,
                        totalItems
                      )}{" "}
                      of{" "}
                      {totalItems}{" "}
                      cities
                    </span>
                  </div>

                  <div className="emp-page-controls">
                    <button
                      className="emp-page-btn"
                      disabled={
                        page === 0
                      }
                      onClick={() =>
                        setPage(
                          page - 1
                        )
                      }
                    >
                      ← Prev
                    </button>

                    {getPaginationRange().map(
                      (pg, i) =>
                        pg ===
                        "..." ? (
                          <span
                            key={`dots-${i}`}
                            className="emp-page-dots"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={pg}
                            className={`emp-page-num ${
                              pg === page
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              setPage(pg)
                            }
                          >
                            {pg + 1}
                          </button>
                        )
                    )}

                    <button
                      className="emp-page-btn"
                      disabled={
                        page + 1 >=
                        totalPages
                      }
                      onClick={() =>
                        setPage(
                          page + 1
                        )
                      }
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="emp-form-wrap">
            <form
              onSubmit={handleSubmit}
              noValidate
              className="emp-form-compact"
            >
              <div className="emp-form-section-compact">
                <div className="emp-section-label">
                  City Information
                </div>

                <div
                  className="emp-form-grid-2col"
                  style={{
                    gridTemplateColumns:
                      "1fr 1fr",
                  }}
                >
                  <div
                    className={`emp-field-compact ${
                      isFieldErr(
                        "cityName"
                      )
                        ? "has-error"
                        : ""
                    } ${
                      isFieldOk(
                        "cityName"
                      )
                        ? "has-ok"
                        : ""
                    }`}
                  >
                    <div className="emp-label-row">
                      <label>
                        City Name{" "}
                        <span className="req">
                          *
                        </span>
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g., Mumbai"
                      value={
                        formData.cityName
                      }
                      maxLength={50}
                      onChange={(e) =>
                        handleChange(
                          "cityName",
                          e.target.value
                        )
                      }
                      onBlur={() =>
                        handleBlur(
                          "cityName"
                        )
                      }
                    />

                    <FieldError
                      msg={
                        errors.cityName
                      }
                    />
                  </div>

                  <div
                    className={`emp-field-compact ${
                      isFieldErr(
                        "cityCode"
                      )
                        ? "has-error"
                        : ""
                    } ${
                      isFieldOk(
                        "cityCode"
                      )
                        ? "has-ok"
                        : ""
                    }`}
                  >
                    <div className="emp-label-row">
                      <label>
                        City Code{" "}
                        <span className="req">
                          *
                        </span>
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g., BOM"
                      value={
                        formData.cityCode
                      }
                      maxLength={5}
                      onChange={(e) =>
                        handleChange(
                          "cityCode",
                          e.target.value.toUpperCase()
                        )
                      }
                      onBlur={() =>
                        handleBlur(
                          "cityCode"
                        )
                      }
                      style={{
                        textTransform:
                          "uppercase",
                      }}
                    />

                    <FieldError
                      msg={
                        errors.cityCode
                      }
                    />
                  </div>
                </div>

                <div
                  className="emp-form-grid-2col"
                  style={{
                    gridTemplateColumns:
                      "1fr 1fr",
                    marginTop: "12px",
                  }}
                >
                  <div
                    className={`emp-field-compact ${
                      !formData.stateId &&
                      touched.stateId
                        ? "has-error"
                        : ""
                    } ${
                      formData.stateId
                        ? "has-ok"
                        : ""
                    }`}
                  >
                    <div className="emp-label-row">
                      <label>
                        State{" "}
                        <span className="req">
                          *
                        </span>
                      </label>
                    </div>

                    <select
                      value={
                        formData.stateId
                      }
                      onChange={(e) =>
                        handleChange(
                          "stateId",
                          e.target.value
                        )
                      }
                      onBlur={() =>
                        handleBlur(
                          "stateId"
                        )
                      }
                      style={{
                        width: "100%",
                        padding:
                          "8px 10px",
                        border:
                          "1px solid #d1d5db",
                        borderRadius:
                          "6px",
                        fontSize:
                          "13px",
                        backgroundColor:
                          "#fff",
                      }}
                    >
                      <option value="">
                        Select State
                      </option>

                      {STATES.map(
                        (state) => (
                          <option
                            key={
                              state.id
                            }
                            value={
                              state.id
                            }
                          >
                            {state.name} (
                            {state.code})
                          </option>
                        )
                      )}
                    </select>

                    {!formData.stateId &&
                      touched.stateId && (
                        <span className="field-err">
                          <FaExclamationCircle
                            size={10}
                          />{" "}
                          Please select a
                          state
                        </span>
                      )}
                  </div>
                </div>
              </div>

              <div className="emp-form-actions">
                <button
                  type="button"
                  className="emp-cancel-btn"
                  onClick={() => {
                    resetForm();
                    setView("list");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="emp-add-btn"
                  disabled={
                    submitting
                  }
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "6px",
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="emp-spinner" />

                      {editMode
                        ? "Updating…"
                        : "Creating…"}
                    </>
                  ) : (
                    <>
                      <FaSave size={12} />

                      {editMode
                        ? "Update City"
                        : "Create City"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {showStatusModal && (
          <div
            className="emp-modal-overlay"
            onClick={() =>
              setShowStatusModal(false)
            }
          >
            <div
              className="emp-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="emp-modal-icon">
                {statusAction.newStatus ===
                "y"
                  ? "✅"
                  : "⛔"}
              </div>

              <h3 className="emp-modal-title">
                Confirm Status Change
              </h3>

              <p className="emp-modal-body">
                Are you sure you want to{" "}
                <strong>
                  {statusAction.newStatus ===
                  "y"
                    ? "activate"
                    : "deactivate"}
                </strong>{" "}
                <strong>
                  {statusAction.name}
                </strong>
                ?
              </p>

              <p className="emp-modal-warn">
                {statusAction.newStatus ===
                "n"
                  ? "Inactive cities cannot be edited until reactivated."
                  : "Active cities will be available for selection."}
              </p>

              <div className="emp-modal-actions">
                <button
                  className="emp-modal-cancel"
                  onClick={() =>
                    setShowStatusModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  className="emp-modal-confirm"
                  onClick={
                    confirmStatusChange
                  }
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default City;